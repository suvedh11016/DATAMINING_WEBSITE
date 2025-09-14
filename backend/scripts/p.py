# #!/usr/bin/env python3
# """
# precompute_and_tune.py

# Full pipeline:
#  - Precompute MinHash (max hashes) for title, desc, hybrid in parallel
#  - Tune (k, num_hashes, num_bands) over grid using a balanced score
#  - Final precompute: slice signatures, compute buckets, write to MongoDB (parallel)
#  - Logs progress
# """

# import os
# import math
# import random
# import itertools
# import hashlib
# from multiprocessing import Pool, cpu_count
# from datasketch import MinHash
# from pymongo import MongoClient
# from tqdm import tqdm
# from pymongo import UpdateOne

# # ---------------- CONFIG ----------------
# MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/cs5600")
# PRODUCTS_COLL = os.getenv("PRODUCTS_COLL", "products")
# SIG_COLL = os.getenv("SIG_COLL", "productsignatures")

# K_VALUES = [2, 3, 5, 7, 10]                 # shingle sizes
# HASH_VALUES = [10, 20, 50, 100, 150]        # candidate number of hashes (num_perm)
# NUM_BANDS_VALUES = [4, 5, 10, 15, 20, 25]   # tuneable number of bands
# MAX_HASHES = max(HASH_VALUES)
# NUM_WORKERS = min( max(1, cpu_count()-1), 5)  # leave 1 core free, cap to 16
# TUNING_SAMPLE = 3000   # sample products to evaluate tuning (set None to use all)
# BATCH_SIZE = 1000      # for final workers returning updates
# PROGRESS_INTERVAL = 200
# # ----------------------------------------

# # ---------------- DB ----------------
# client = MongoClient(MONGO_URI)
# db = client.get_default_database()
# products_col = db[PRODUCTS_COLL]
# signatures_col = db[SIG_COLL]
# # ------------------------------------

# def get_char_shingles(text, k):
#     if not text:
#         return []
#     clean = " ".join(str(text).lower().split())
#     if len(clean) < k:
#         return []
#     return [clean[i:i+k] for i in range(len(clean) - k + 1)]

# def compute_minhash_for_text(text, k, num_perm=MAX_HASHES):
#     m = MinHash(num_perm=num_perm)
#     shingles = get_char_shingles(text, k)
#     for s in shingles:
#         m.update(s.encode("utf8"))
#     # m.hashvalues is a numpy array of length num_perm
#     return m.hashvalues.tolist()

# def _worker_precompute(args):
#     """Worker to compute full-size MinHash (MAX_HASHES) for a product's title, desc, hybrid.
#        Returns (asin, title_hashvalues, desc_hashvalues, hybrid_hashvalues)
#     """
#     p = args
#     asin = p.get("asin")
#     title = p.get("title") or ""
#     desc = p.get("description") or ""
#     # description may be list; join if so
#     if isinstance(desc, list):
#         desc = " ".join(desc)
#     hybrid = (title + " " + desc).strip()

#     # compute with MAX_HASHES and k placeholder (we'll store arrays for all K choices by recomputing later
#     # but to avoid repeated expensive MinHash, we compute per k below instead. To match Node approach,
#     # we compute for all K_VALUES *once* per product: produce dict of k -> hashvalues for hybrid, title, desc.
#     result = {"asin": asin}
#     for k in K_VALUES:
#         pst = compute_minhash_for_text(title, k, num_perm=MAX_HASHES)
#         psd = compute_minhash_for_text(desc, k, num_perm=MAX_HASHES)
#         pstd = compute_minhash_for_text(hybrid, k, num_perm=MAX_HASHES)
#         result[f"pst_k{k}"] = pst
#         result[f"psd_k{k}"] = psd
#         result[f"pstd_k{k}"] = pstd
#     return result

# def compute_buckets_from_signature(sig_slice, num_hashes, num_bands):
#     # sig_slice: list of ints length num_hashes
#     # compute rows per band, form band keys as joined strings
#     rows_per_band = max(1, num_hashes // num_bands)
#     buckets = []
#     for b in range(num_bands):
#         start = b * rows_per_band
#         band = sig_slice[start:start+rows_per_band]
#         if not band:
#             continue
#         # Use join of ints with '-' as bucket ID (as Node code did)
#         buckets.append("-".join(map(str, band)))
#     return buckets

# def candidate_probability(s, r, b):
#     # P(candidate) = 1 - (1 - s^r)^b
#     return 1.0 - (1.0 - (s ** r)) ** b

# # ---------------- Precompute all signatures (parallel) ----------------
# def precompute_all(products):
#     print("⚡ Precomputing full-size MinHash arrays (parallel)...")
#     with Pool(processes=NUM_WORKERS) as pool:
#         # tqdm with imap_unordered for streaming progress
#         results = []
#         for r in tqdm(pool.imap_unordered(_worker_precompute, products), total=len(products)):
#             results.append(r)
#     # Map by asin
#     all_sigs = {}
#     for r in results:
#         asin = r["asin"]
#         all_sigs[asin] = {}
#         for k in K_VALUES:
#             all_sigs[asin][k] = {
#                 "pst": r[f"pst_k{k}"],
#                 "psd": r[f"psd_k{k}"],
#                 "pstd": r[f"pstd_k{k}"],
#             }
#     print("✅ Precompute finished.")
#     return all_sigs

# # ---------------- Tuning ----------------
# def tune_parameters(products, all_sigs, sample_size=TUNING_SAMPLE):
#     print("📊 Tuning parameters (k, num_hashes, num_bands)...")
#     # sample products for tuning (random but fixed)
#     if sample_size and sample_size < len(products):
#         sampled = random.sample(products, sample_size)
#     else:
#         sampled = products

#     best = None
#     total_configs = len(K_VALUES) * len(HASH_VALUES) * len(NUM_BANDS_VALUES)
#     cfg_count = 0

#     for k in K_VALUES:
#         for num_hashes in HASH_VALUES:
#             for num_bands in NUM_BANDS_VALUES:
#                 cfg_count += 1
#                 r = max(1, num_hashes // num_bands)  # rows per band
#                 # skip if rows per band is zero (shouldn't be)
#                 seen = set()
#                 overlaps = 0
#                 # iterate sampled products
#                 for idx, p in enumerate(sampled, 1):
#                     asin = p["asin"]
#                     sigs = all_sigs.get(asin)
#                     if not sigs:
#                         continue
#                     # use precomputed k arrays and slice
#                     sig = sigs[k]["pstd"][:num_hashes]  # hybrid used for tuning (like Node)
#                     buckets = compute_buckets_from_signature(sig, num_hashes, num_bands)
#                     found = False
#                     for b in buckets:
#                         if b in seen:
#                             found = True
#                             break
#                     if found:
#                         overlaps += 1
#                     for b in buckets:
#                         seen.add(b)
#                     if idx % 1000 == 0:
#                         print(f"   tuning progress config {cfg_count}/{total_configs}: processed {idx}/{len(sampled)}")
#                 recall = overlaps / max(1, len(sampled))
#                 pLow = candidate_probability(0.4, r, num_bands)
#                 pHigh = candidate_probability(0.8, r, num_bands)
#                 theoryScore = pHigh - pLow
#                 penalty = 0.5 if (recall > 0.9 or recall < 0.3) else 0.0
#                 score = theoryScore - penalty

#                 print(f"   cfg {cfg_count}/{total_configs} K={k}, n={num_hashes}, bands={num_bands} -> overlaps={overlaps}, recall={recall:.3f}, pLow={pLow:.3f}, pHigh={pHigh:.3f}, score={score:.4f}")

#                 if not best or score > best["score"]:
#                     best = {"k": k, "num_hashes": num_hashes, "num_bands": num_bands, "r": r, "overlaps": overlaps, "recall": recall, "pLow": pLow, "pHigh": pHigh, "score": score}
#     print("✅ Best configuration (balanced):", best)
#     return best

# # ---------------- Final precompute & DB write (parallel) ----------------
# def _worker_final(batch_args):
#     """Worker that takes (batch_products, all_sigs, best) and returns list of bulk updates"""
#     batch, all_sigs, best = batch_args
#     k = best["k"]
#     num_hashes = best["num_hashes"]
#     num_bands = best["num_bands"]

#     updates = []
#     processed = 0
#     for p in batch:
#         asin = p["asin"]
#         title = p.get("title") or ""
#         desc_field = p.get("description") or ""
#         if isinstance(desc_field, list):
#             desc = " ".join(desc_field)
#         else:
#             desc = desc_field
#         hybrid = (title + " " + desc).strip()

#         # slice precomputed arrays
#         sigs = all_sigs.get(asin, {})
#         # fallback: compute if missing (rare)
#         if not sigs:
#             # compute directly small MinHash
#             pst_sig = compute_minhash_for_text(title, k, num_perm=num_hashes)
#             psd_sig = compute_minhash_for_text(desc, k, num_perm=num_hashes)
#             pstd_sig = compute_minhash_for_text(hybrid, k, num_perm=num_hashes)
#         else:
#             pst_sig = sigs[k]["pst"][:num_hashes]
#             psd_sig = sigs[k]["psd"][:num_hashes]
#             pstd_sig = sigs[k]["pstd"][:num_hashes]

#         pst_buckets = compute_buckets_from_signature(pst_sig, num_hashes, num_bands)
#         psd_buckets = compute_buckets_from_signature(psd_sig, num_hashes, num_bands)
#         pstd_buckets = compute_buckets_from_signature(pstd_sig, num_hashes, num_bands)

#         # updates.append({
#         #     "updateOne": {
#         #         "filter": {"asin": asin},
#         #         "update": {"$set": {
#         #             "asin": asin,
#         #             "pst_sig": pst_sig,
#         #             "psd_sig": psd_sig,
#         #             "pstd_sig": pstd_sig,
#         #             "pst_buckets": pst_buckets,
#         #             "psd_buckets": psd_buckets,
#         #             "pstd_buckets": pstd_buckets
#         #         }},
#         #         "upsert": True
#         #     }
#         # })


#         updates.append(
#             UpdateOne(
#                 {"asin": asin},
#                 {"$set": {
#                     "asin": asin,
#                     "pst_sig": pst_sig,
#                     "psd_sig": psd_sig,
#                     "pstd_sig": pstd_sig,
#                     "pst_buckets": pst_buckets,
#                     "psd_buckets": psd_buckets,
#                     "pstd_buckets": pstd_buckets
#                 }},
#                 upsert=True
#             )
#         )

#         processed += 1
#         if processed % PROGRESS_INTERVAL == 0 or processed == len(batch):
#             # just return a short status as part of worker results (printed by main)
#             pass

#     return updates

# def final_precompute_and_write(products, all_sigs, best):
#     print("\n🚀 Running final precompute with:", best)
#     # create batches
#     batch_size = math.ceil(len(products) / NUM_WORKERS)
#     batches = [products[i:i+batch_size] for i in range(0, len(products), batch_size)]

#     # prepare args for workers
#     args = [(batch, all_sigs, best) for batch in batches]

#     # run in pool and perform DB bulk writes as results come in
#     with Pool(processes=NUM_WORKERS) as pool:
#         for i, res in enumerate(pool.imap_unordered(_worker_final, args), 1):
#             # res is list of bulk ops
#             if res:
#                 try:
#                     signatures_col.bulk_write(res)
#                 except Exception as e:
#                     print(f"Bulk write error on batch {i}: {e}")
#             print(f"[Worker-result {i}/{len(batches)}] wrote {len(res)} updates")

#     print("✅ Final precompute finished and saved to DB.")

# # ---------------- Main ----------------
# def main():
#     products = list(products_col.find({}, {"asin":1, "title":1, "description":1}))
#     print(f"📦 Found {len(products)} products.")
#     if not products:
#         print("No products found in DB. Exiting.")
#         return

#     # Step 1: precompute all signatures (full-size for each K)
#     all_sigs = precompute_all(products)

#     # Step 2: tune parameters
#     best = tune_parameters(products, all_sigs, sample_size=TUNING_SAMPLE)

#     # Step 3: final precompute & write to DB
#     final_precompute_and_write(products, all_sigs, best)

# if __name__ == "__main__":
#     main()




#!/usr/bin/env python3
"""
full_pipeline_lsh.py

- Precompute MinHash signatures (parallel)
- Tune (k, num_hashes, num_bands) with balanced score
- Build LSH index
- Compute ordered top-10 similar ASINs using LSH (efficient)
- Save signatures + top-10 similars to MongoDB
"""

import os
import math
import random
import sys
from multiprocessing import Pool, cpu_count
from datasketch import MinHash, MinHashLSH
from pymongo import MongoClient, UpdateOne
from tqdm import tqdm

# ---------------- CONFIG ----------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/cs5600")
PRODUCTS_COLL = os.getenv("PRODUCTS_COLL", "products")
SIG_COLL = os.getenv("SIG_COLL", "productsignatures")

K_VALUES = [2, 3, 5, 7, 10]
HASH_VALUES = [10, 20, 50, 100, 150]
NUM_BANDS_VALUES = [4, 5, 10, 15, 20, 25]
MAX_HASHES = max(HASH_VALUES)
NUM_WORKERS = max(1, min(cpu_count() - 1, 12))  # leave one core free, cap at 12
TUNING_SAMPLE = 1000
TOP_K = 10
BULK_BATCH = 500
# ----------------------------------------

# ---------------- DB ----------------
client = MongoClient(MONGO_URI)
db = client.get_default_database()
products_col = db[PRODUCTS_COLL]
signatures_col = db[SIG_COLL]
# ------------------------------------

# ---------------- Helpers ----------------
def get_char_shingles(text, k):
    if not text:
        return []
    clean = " ".join(str(text).lower().split())
    if len(clean) < k:
        return []
    return [clean[i:i+k] for i in range(len(clean) - k + 1)]

def compute_minhash(text, k, num_perm=MAX_HASHES):
    m = MinHash(num_perm=num_perm)
    shingles = get_char_shingles(text, k)
    for s in shingles:
        m.update(s.encode("utf8"))
    return m

# ---------------- Precompute (parallel) ----------------
def _worker_precompute(product):
    asin = product.get("asin")
    title = product.get("title") or ""
    desc_field = product.get("description") or ""
    desc = " ".join(desc_field) if isinstance(desc_field, list) else desc_field
    hybrid = (title + " " + desc).strip()

    out = {"asin": asin}
    for k in K_VALUES:
        out[f"pst_k{k}"] = compute_minhash(title, k)
        out[f"psd_k{k}"] = compute_minhash(desc, k)
        out[f"pstd_k{k}"] = compute_minhash(hybrid, k)
    return out

def precompute_all(products):
    print(f"⚡ Precomputing MinHash objects ({NUM_WORKERS} workers)...")
    results = []
    with Pool(processes=NUM_WORKERS) as pool:
        for r in tqdm(pool.imap_unordered(_worker_precompute, products),
                      total=len(products), file=sys.stdout):
            results.append(r)

    all_sigs = {}
    for r in results:
        asin = r["asin"]
        all_sigs[asin] = {k: {"pst": r[f"pst_k{k}"], 
                              "psd": r[f"psd_k{k}"], 
                              "pstd": r[f"pstd_k{k}"]} for k in K_VALUES}
    print("✅ Precompute finished.")
    return all_sigs

# ---------------- LSH tuning helpers ----------------
def compute_bands_from_signature(sig, num_hashes, num_bands):
    hv = sig.hashvalues[:num_hashes]
    rows_per_band = max(1, num_hashes // num_bands)
    bands = []
    for b in range(num_bands):
        start = b * rows_per_band
        band = tuple(hv[start:start+rows_per_band])
        if band:
            bands.append(band)
    return bands

def candidate_probability(s, r, b):
    return 1.0 - (1.0 - (s ** r)) ** b

# ---------------- Tuning ----------------
def tune_parameters(products, all_sigs, sample_size=TUNING_SAMPLE):
    print("📊 Tuning parameters (k, num_hashes, num_bands)...")
    sampled = random.sample(products, sample_size) if sample_size and sample_size < len(products) else products
    best = None

    for k in K_VALUES:
        for num_hashes in HASH_VALUES:
            for num_bands in NUM_BANDS_VALUES:
                r = max(1, num_hashes // num_bands)
                seen = set()
                overlaps = 0

                for p in sampled:
                    asin = p["asin"]
                    sigs = all_sigs.get(asin)
                    if not sigs:
                        continue
                    sig = sigs[k]["pstd"]
                    bands = compute_bands_from_signature(sig, num_hashes, num_bands)
                    if any(b in seen for b in bands):
                        overlaps += 1
                    for b in bands:
                        seen.add(b)

                recall = overlaps / max(1, len(sampled))
                pLow = candidate_probability(0.4, r, num_bands)
                pHigh = candidate_probability(0.8, r, num_bands)
                theoryScore = pHigh - pLow
                penalty = 0.5 if (recall < 0.3 or recall > 0.9) else 0.0
                score = theoryScore - penalty

                if not best or score > best["score"]:
                    best = {"k": k, "num_hashes": num_hashes, "num_bands": num_bands, "r": r,
                            "overlaps": overlaps, "recall": recall, "pLow": pLow, "pHigh": pHigh, "score": score}
    print("✅ Best configuration:", best)
    return best

# ---------------- LSH build & query ----------------
# def build_lsh(all_sigs, k, num_hashes, num_bands):
#     print(f"🔧 Building LSH index (num_hashes={num_hashes}, bands={num_bands})...")
#     lsh = MinHashLSH(num_perm=num_hashes, params=(num_bands,))
#     asin_to_minhash = {}

#     for asin, sigs in all_sigs.items():
#         m = MinHash(num_perm=num_hashes)
#         m.hashvalues = sigs[k]["pstd"].hashvalues[:num_hashes]
#         asin_to_minhash[asin] = m
#         lsh.insert(asin, m)

#     print("✅ LSH index built.")
#     return lsh, asin_to_minhash
def build_lsh(all_sigs, k, num_hashes, num_bands):
    r = max(1, num_hashes // num_bands)
    lsh = MinHashLSH(num_perm=num_hashes, params=(num_bands, r))
    asin_to_minhash = {}

    for asin, sigs in all_sigs.items():
        hv = sigs[k]["pstd"][:num_hashes]  # list of ints
        m = MinHash(num_perm=num_hashes)
        m.hashvalues = hv  # restore
        lsh.insert(asin, m)
        asin_to_minhash[asin] = m
    return lsh, asin_to_minhash

def get_topk_similars(asin, m, lsh, asin_to_minhash, top_k=TOP_K):
    candidates = lsh.query(m)
    sims = []
    for cand in candidates:
        if cand == asin:
            continue
        score = m.jaccard(asin_to_minhash[cand])
        sims.append((score, cand))
    sims.sort(reverse=True, key=lambda x: x[0])
    return [{"asin": c, "score": float(s)} for s, c in sims[:top_k]]

# ---------------- Compute + Save ----------------
def final_compute_and_write(products, all_sigs, best):
    print("\n🚀 Computing top-10 similars with LSH...")
    k = best["k"]
    num_hashes = best["num_hashes"]
    num_bands = best["num_bands"]

    lsh, asin_to_minhash = build_lsh(all_sigs, k, num_hashes, num_bands)
    updates = []

    for p in tqdm(products, total=len(products), file=sys.stdout):
        asin = p["asin"]
        sigs = all_sigs[asin][k]
        m = asin_to_minhash[asin]
        similars = {
            "pst": get_topk_similars(asin, sigs["pst"], lsh, asin_to_minhash),
            "psd": get_topk_similars(asin, sigs["psd"], lsh, asin_to_minhash),
            "pstd": get_topk_similars(asin, sigs["pstd"], lsh, asin_to_minhash),
        }
        updates.append(UpdateOne(
            {"asin": asin},
            {"$set": {
                "asin": asin,
                "pst_sig": sigs["pst"].hashvalues[:num_hashes].tolist(),
                "psd_sig": sigs["psd"].hashvalues[:num_hashes].tolist(),
                "pstd_sig": sigs["pstd"].hashvalues[:num_hashes].tolist(),
                "similar": similars
            }},
            upsert=True
        ))
        if len(updates) >= BULK_BATCH:
            signatures_col.bulk_write(updates)
            updates = []

    if updates:
        signatures_col.bulk_write(updates)
    print("✅ All results saved to DB.")

# ---------------- Main ----------------
def main():
    products = list(products_col.find({}, {"asin":1, "title":1, "description":1}))
    print(f"📦 Found {len(products)} products.")
    if not products:
        print("No products in DB — exiting.")
        return

    all_sigs = precompute_all(products)
    best = tune_parameters(products, all_sigs, sample_size=TUNING_SAMPLE)
    final_compute_and_write(products, all_sigs, best)

if __name__ == "__main__":
    main()
