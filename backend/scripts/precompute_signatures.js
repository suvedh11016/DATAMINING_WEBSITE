// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Product from "../models/product.model.js";
// import ProductSignature from "../models/productSignature.model.js";
// import crypto from "crypto";

// dotenv.config();

// const NUM_HASHES = 100;
// const NUM_BANDS = 5;

// // 2-shingles
// const getShingles = (text) => {
//   if (!text) return [];
//   const words = text.toLowerCase().replace(/\s+/g, " ").split(" ");
//   const shingles = [];
//   for (let i = 0; i < words.length - 1; i++) {
//     shingles.push(words[i] + " " + words[i + 1]);
//   }
//   return shingles;
// };

// // MinHash
// // const minHash = (shingles, numHashes = NUM_HASHES) => {
// //   if (shingles.length === 0) return Array(numHashes).fill(Infinity);
// //   const sig = [];
// //   for (let i = 0; i < numHashes; i++) {
// //     let minVal = Infinity;
// //     for (const sh of shingles) {
// //       const hash = parseInt(
// //         crypto.createHash("sha256").update(sh + i).digest("hex").slice(0, 8),
// //         16
// //       );
// //       if (hash < minVal) minVal = hash;
// //     }
// //     sig.push(minVal);
// //   }
// //   return sig;
// // };
// // MinHash
// const minHash = (shingles, numHashes = NUM_HASHES) => {
//   if (!shingles || shingles.length === 0) {
//     // Return zeros instead of Infinity when no shingles
//     return Array(numHashes).fill(0);
//   }
//   const sig = [];
//   for (let i = 0; i < numHashes; i++) {
//     let minVal = Infinity;
//     for (const sh of shingles) {
//       const hash = parseInt(
//         crypto.createHash("sha256").update(sh + i).digest("hex").slice(0, 8),
//         16
//       );
//       if (hash < minVal) minVal = hash;
//     }
//     sig.push(minVal);
//   }
//   return sig;
// };


// // LSH buckets
// const computeLSHBuckets = (signature, bands = NUM_BANDS) => {
//   const rows = Math.ceil(signature.length / bands);
//   const buckets = [];
//   for (let b = 0; b < bands; b++) {
//     const start = b * rows;
//     const band = signature.slice(start, start + rows);
//     if (band.length === 0) continue;
//     const bucketId = band.join("-");
//     buckets.push(bucketId);
//   }
//   return buckets;
// };

// // Connect DB
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cs5600");
//     console.log("✅ MongoDB connected");
//   } catch (err) {
//     console.error("❌ DB connection error:", err.message);
//     process.exit(1);
//   }
// };

// const precomputeSignatures = async () => {
//   await connectDB();

//   const products = await Product.find();
//   console.log(`Found ${products.length} products.`);

//   let count = 0;
//   for (const p of products) {
//     const title = p.title || "";
//     const desc = Array.isArray(p.description) ? p.description.join(" ") : (p.description || "");
//     const hybrid = (title + " " + desc).trim();

//     const pst_sig = minHash(getShingles(title));
//     const psd_sig = minHash(getShingles(desc));
//     const pstd_sig = minHash(getShingles(hybrid));

//     const pst_buckets = computeLSHBuckets(pst_sig);
//     const psd_buckets = computeLSHBuckets(psd_sig);
//     const pstd_buckets = computeLSHBuckets(pstd_sig);

//     await ProductSignature.updateOne(
//       { asin: p.asin },
//       {
//         $set: {
//           asin: p.asin,
//           pst_sig,
//           psd_sig,
//           pstd_sig,
//           pst_buckets,
//           psd_buckets,
//           pstd_buckets,
//         },
//       },
//       { upsert: true }
//     );

//     count++;
//     if (count % 100 === 0 || count === products.length) {
//       console.log(
//         `Processed ${count}/${products.length} – asin=${p.asin}, pst_buckets=${pst_buckets.length}`
//       );
//     }
//   }

//   console.log(`\n✅ Precompute finished for ${count} products.`);
//   await mongoose.disconnect();
// };

// precomputeSignatures();


// correct code --------->>>>>>

// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Product from "../models/product.model.js";
// import ProductSignature from "../models/productSignature.model.js";
// import crypto from "crypto";

// dotenv.config();

// const NUM_HASHES = 40;
// const NUM_BANDS = 20;
// const ROWS_PER_BAND = NUM_HASHES / NUM_BANDS; // ✅ fixed: consistent with querying

// // 2-shingles
// const getShingles = (text) => {
//   if (!text) return [];
//   const words = text.toLowerCase().replace(/\s+/g, " ").split(" ");
//   const shingles = [];
//   for (let i = 0; i < words.length - 1; i++) {
//     shingles.push(words[i] + " " + words[i + 1]);
//   }
//   return shingles;
// };

// // MinHash
// const minHash = (shingles, numHashes = NUM_HASHES) => {
//   if (!shingles || shingles.length === 0) {
//     // Return zeros instead of Infinity when no shingles
//     return Array(numHashes).fill(0);
//   }
//   const sig = [];
//   for (let i = 0; i < numHashes; i++) {
//     let minVal = Infinity;
//     for (const sh of shingles) {
//       const hash = parseInt(
//         crypto.createHash("sha256").update(sh + i).digest("hex").slice(0, 8),
//         16
//       );
//       if (hash < minVal) minVal = hash;
//     }
//     sig.push(minVal);
//   }
//   return sig;
// };

// // LSH buckets
// const computeLSHBuckets = (signature, bands = NUM_BANDS) => {
//   const buckets = [];
//   for (let b = 0; b < bands; b++) {
//     const start = b * ROWS_PER_BAND;
//     const band = signature.slice(start, start + ROWS_PER_BAND);
//     if (band.length === 0) continue;
//     const bucketId = band.join("-");
//     buckets.push(bucketId);
//   }
//   return buckets;
// };

// // Connect DB
// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cs5600");
//     console.log("✅ MongoDB connected");
//   } catch (err) {
//     console.error("❌ DB connection error:", err.message);
//     process.exit(1);
//   }
// };

// const precomputeSignatures = async () => {
//   await connectDB();

//   const products = await Product.find();
//   console.log(`Found ${products.length} products.`);

//   let count = 0;
//   for (const p of products) {
//     const title = p.title || "";
//     const desc = Array.isArray(p.description) ? p.description.join(" ") : (p.description || "");
//     const hybrid = (title + " " + desc).trim();

//     const pst_sig = minHash(getShingles(title));
//     const psd_sig = minHash(getShingles(desc));
//     const pstd_sig = minHash(getShingles(hybrid));

//     const pst_buckets = computeLSHBuckets(pst_sig);
//     const psd_buckets = computeLSHBuckets(psd_sig);
//     const pstd_buckets = computeLSHBuckets(pstd_sig);

//     await ProductSignature.updateOne(
//       { asin: p.asin },
//       {
//         $set: {
//           asin: p.asin,
//           pst_sig,
//           psd_sig,
//           pstd_sig,
//           pst_buckets,
//           psd_buckets,
//           pstd_buckets,
//         },
//       },
//       { upsert: true }
//     );

//     count++;
//     if (count % 100 === 0 || count === products.length) {
//       console.log(
//         `Processed ${count}/${products.length} – asin=${p.asin}, pst_buckets=${pst_buckets.length}`
//       );
//     }
//   }

//   console.log(`\n✅ Precompute finished for ${count} products.`);
//   await mongoose.disconnect();
// };

// precomputeSignatures();

// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Product from "../models/product.model.js";
// import ProductSignature from "../models/productSignature.model.js";
// import crypto from "crypto";

// dotenv.config();

// const K_VALUES = [2, 3, 5, 7, 10];
// const HASH_VALUES = [10, 20, 50, 100, 150];
// const NUM_BANDS = 20;
// const MAX_HASHES = 150; // precompute max hashes

// // --- Shingling ---
// const getCharShingles = (text, k) => {
//   if (!text) return [];
//   const clean = text.toLowerCase().replace(/\s+/g, " ");
//   const shingles = [];
//   for (let i = 0; i <= clean.length - k; i++) {
//     shingles.push(clean.slice(i, i + k));
//   }
//   return shingles;
// };

// // --- Minhash (up to MAX_HASHES) ---
// const minHash = (shingles, numHashes = MAX_HASHES) => {
//   if (!shingles || shingles.length === 0) {
//     return Array(numHashes).fill(0);
//   }
//   const sig = [];
//   for (let i = 0; i < numHashes; i++) {
//     let minVal = Infinity;
//     for (const sh of shingles) {
//       const hash = parseInt(
//         crypto.createHash("sha256").update(sh + i).digest("hex").slice(0, 8),
//         16
//       );
//       if (hash < minVal) minVal = hash;
//     }
//     sig.push(minVal);
//   }
//   return sig;
// };

// // --- LSH ---
// const computeLSHBuckets = (signature, numHashes, numBands = NUM_BANDS) => {
//   const rowsPerBand = Math.floor(numHashes / numBands);
//   const buckets = [];
//   for (let b = 0; b < numBands; b++) {
//     const start = b * rowsPerBand;
//     const band = signature.slice(start, start + rowsPerBand);
//     if (band.length === 0) continue;
//     const bucketId = band.join("-");
//     buckets.push(bucketId);
//   }
//   return buckets;
// };

// // --- DB connection ---
// const connectDB = async () => {
//   try {
//     await mongoose.connect(
//       process.env.MONGO_URI || "mongodb://localhost:27017/cs5600"
//     );
//     console.log("✅ MongoDB connected");
//   } catch (err) {
//     console.error("❌ DB connection error:", err.message);
//     process.exit(1);
//   }
// };

// // --- Step 1: Precompute all signatures once ---
// // const precomputeAllSignatures = async (products) => {
// //   console.log("\n⚡ Precomputing all signatures up to 150 hashes...");
// //   const allSigs = {}; // {asin: {K: signature}}

// //   for (const p of products) {
// //     const hybrid = ((p.title || "") + " " + (Array.isArray(p.description) ? p.description.join(" ") : p.description || "")).trim();
// //     allSigs[p.asin] = {};
// //     for (const k of K_VALUES) {
// //       const shingles = getCharShingles(hybrid, k);
// //       allSigs[p.asin][k] = minHash(shingles, MAX_HASHES);
// //     }
// //   }
// //   return allSigs;
// // };

// const precomputeAllSignatures = async (products) => {
//   console.log("\n⚡ Precomputing all signatures up to 150 hashes...");
//   const allSigs = {}; // {asin: {K: signature}}

//   let count = 0;
//   for (const p of products) {
//     const hybrid = ((p.title || "") + " " + (Array.isArray(p.description) ? p.description.join(" ") : p.description || "")).trim();
//     allSigs[p.asin] = {};
//     for (const k of K_VALUES) {
//       const shingles = getCharShingles(hybrid, k);
//       allSigs[p.asin][k] = minHash(shingles, MAX_HASHES);
//     }

//     count++;
//     if (count % 500 === 0 || count === products.length) {
//       console.log(`   → Precomputed ${count}/${products.length}`);
//     }
//   }
//   return allSigs;
// };


// // --- Step 2: Tuning ---
// const tuneParametersWithData = (products, allSigs) => {
//   let best = null;
//   console.log("\n📊 Tuning Results:");

//   for (const k of K_VALUES) {
//     for (const numHashes of HASH_VALUES) {
//       const r = Math.floor(numHashes / NUM_BANDS);
//       if (r <= 0) continue;

//       let overlaps = 0;
//       const seenBuckets = new Map();

//       for (const p of products) {
//         const sig = allSigs[p.asin][k].slice(0, numHashes); // truncate
//         const buckets = computeLSHBuckets(sig, numHashes, NUM_BANDS);

//         let found = false;
//         for (const b of buckets) {
//           if (seenBuckets.has(b)) {
//             found = true;
//             break;
//           }
//         }
//         if (found) overlaps++;
//         buckets.forEach((b) => seenBuckets.set(b, true));
//       }

//       const score = overlaps / products.length;

//       console.log(
//         `K=${k}, n=${numHashes}, r=${r} | overlaps=${overlaps}, score=${score.toFixed(3)}`
//       );

//       if (!best || score > best.score) {
//         best = { k, numHashes, r, b: NUM_BANDS, overlaps, score };
//       }
//     }
//   }

//   console.log("\n✅ Best configuration:");
//   console.log(best);
//   return best;
// };

// // --- Step 3: Final precompute with best config ---
// const finalPrecompute = async (products, allSigs, best) => {
//   const { k: K, numHashes: NUM_HASHES, b: NUM_BANDS } = best;
//   console.log(`\n🚀 Running final precompute with K=${K}, NUM_HASHES=${NUM_HASHES}, NUM_BANDS=${NUM_BANDS}`);

//   let count = 0;
//   for (const p of products) {
//     const title = p.title || "";
//     const desc = Array.isArray(p.description) ? p.description.join(" ") : (p.description || "");
//     const hybrid = (title + " " + desc).trim();

//     const pst_sig = allSigs[p.asin][K].slice(0, NUM_HASHES); // reuse signatures
//     const psd_sig = minHash(getCharShingles(desc, K), NUM_HASHES);
//     const pstd_sig = allSigs[p.asin][K].slice(0, NUM_HASHES);

//     const pst_buckets = computeLSHBuckets(pst_sig, NUM_HASHES, NUM_BANDS);
//     const psd_buckets = computeLSHBuckets(psd_sig, NUM_HASHES, NUM_BANDS);
//     const pstd_buckets = computeLSHBuckets(pstd_sig, NUM_HASHES, NUM_BANDS);

//     await ProductSignature.updateOne(
//       { asin: p.asin },
//       {
//         $set: {
//           asin: p.asin,
//           pst_sig,
//           psd_sig,
//           pstd_sig,
//           pst_buckets,
//           psd_buckets,
//           pstd_buckets,
//         },
//       },
//       { upsert: true }
//     );

//     count++;
//     if (count % 100 === 0 || count === products.length) {
//       console.log(`Processed ${count}/${products.length} – asin=${p.asin}`);
//     }
//   }

//   console.log(`\n✅ Final precompute finished for ${count} products.`);
// };

// // --- Main ---
// const run = async () => {
//   await connectDB();
//   const products = await Product.find();
//   console.log(`Found ${products.length} products.`);

//   const allSigs = await precomputeAllSignatures(products);
//   const best = tuneParametersWithData(products, allSigs);
//   await finalPrecompute(products, allSigs, best);

//   await mongoose.disconnect();
// };

// run();




// penalization+everything but allsigs are senidng, working fine -------------->
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import Product from "../models/product.model.js";
// import ProductSignature from "../models/productSignature.model.js";
// import crypto from "crypto";
// import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

// dotenv.config();

// const K_VALUES = [2, 3, 5, 7, 10];
// const HASH_VALUES = [10, 20, 50, 100, 150];
// const NUM_BANDS = 20;
// const MAX_HASHES = 150;
// const NUM_WORKERS = 16;

// // --- Shingling ---
// const getCharShingles = (text, k) => {
//   if (!text) return [];
//   const clean = text.toLowerCase().replace(/\s+/g, " ");
//   const shingles = [];
//   for (let i = 0; i <= clean.length - k; i++) shingles.push(clean.slice(i, i + k));
//   return shingles;
// };

// // --- Minhash ---
// const minHash = (shingles, numHashes = MAX_HASHES) => {
//   if (!shingles || shingles.length === 0) return Array(numHashes).fill(0);
//   const sig = [];
//   for (let i = 0; i < numHashes; i++) {
//     let minVal = Infinity;
//     for (const sh of shingles) {
//       const hash = parseInt(
//         crypto.createHash("sha256").update(sh + i).digest("hex").slice(0, 8),
//         16
//       );
//       if (hash < minVal) minVal = hash;
//     }
//     sig.push(minVal);
//   }
//   return sig;
// };

// // --- LSH ---
// const computeLSHBuckets = (signature, numHashes, numBands = NUM_BANDS) => {
//   const rowsPerBand = Math.floor(numHashes / numBands);
//   const buckets = [];
//   for (let b = 0; b < numBands; b++) {
//     const start = b * rowsPerBand;
//     const band = signature.slice(start, start + rowsPerBand);
//     if (band.length === 0) continue;
//     buckets.push(band.join("-"));
//   }
//   return buckets;
// };

// // --- DB ---
// const connectDB = async () => {
//   await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cs5600");
//   console.log("✅ MongoDB connected");
// };

// // --- Worker logic ---
// if (!isMainThread) {
//   const { batch, allSigs, best, workerId } = workerData;
//   const { k: K, numHashes: NUM_HASHES, b: NUM_BANDS } = best;

//   let processed = 0;
//   const updates = batch.map(p => {
//     const title = p.title || "";
//     const desc = Array.isArray(p.description) ? p.description.join(" ") : p.description || "";

//     const pst_sig = allSigs[p.asin][K].slice(0, NUM_HASHES);
//     const psd_sig = minHash(getCharShingles(desc, K), NUM_HASHES);
//     const pstd_sig = allSigs[p.asin][K].slice(0, NUM_HASHES);

//     processed++;
//     if (processed % 50 === 0 || processed === batch.length) {
//       parentPort.postMessage({ type: "progress", msg: `Processed ${processed}/${batch.length}` });
//     }

//     return {
//       updateOne: {
//         filter: { asin: p.asin },
//         update: {
//           asin: p.asin,
//           pst_sig, psd_sig, pstd_sig,
//           pst_buckets: computeLSHBuckets(pst_sig, NUM_HASHES, NUM_BANDS),
//           psd_buckets: computeLSHBuckets(psd_sig, NUM_HASHES, NUM_BANDS),
//           pstd_buckets: computeLSHBuckets(pstd_sig, NUM_HASHES, NUM_BANDS)
//         },
//         upsert: true,
//       },
//     };
//   });

//   parentPort.postMessage({ type: "done", updates });
// }

// // --- Main thread ---
// const run = async () => {
//   await connectDB();
//   const products = await Product.find();
//   console.log(`📦 Found ${products.length} products.`);

//   // --- Precompute all signatures ---
//   console.log("⚡ Precomputing all signatures...");
//   const allSigs = {};
//   for (let i = 0; i < products.length; i++) {
//     const p = products[i];
//     const hybrid = ((p.title || "") + " " + (Array.isArray(p.description) ? p.description.join(" ") : p.description || "")).trim();
//     allSigs[p.asin] = {};
//     for (const k of K_VALUES) allSigs[p.asin][k] = minHash(getCharShingles(hybrid, k), MAX_HASHES);

//     if ((i+1) % 500 === 0 || i+1 === products.length) {
//       console.log(`   → Precomputed ${i+1}/${products.length} signatures`);
//     }
//   }

//   // --- Balanced tuning ---
//   console.log("📊 Tuning parameters...");
//   let best = null;
//   for (const k of K_VALUES) {
//     for (const numHashes of HASH_VALUES) {
//       const r = Math.floor(numHashes / NUM_BANDS);
//       if (r <= 0) continue;

//       let overlaps = 0;
//       const seenBuckets = new Map();
//       for (const p of products) {
//         const sig = allSigs[p.asin][k].slice(0, numHashes);
//         const buckets = computeLSHBuckets(sig, numHashes, NUM_BANDS);
//         if (buckets.some(b => seenBuckets.has(b))) overlaps++;
//         buckets.forEach(b => seenBuckets.set(b, true));
//       }

//       const score = (1 - overlaps / products.length) * Math.min(1, r / 5);
//       if (!best || score > best.score) best = { k, numHashes, r, b: NUM_BANDS, overlaps, score };
//     }
//   }
//   console.log("✅ Best config:", best);

//   // --- Parallel workers ---
//   const batchSize = Math.ceil(products.length / NUM_WORKERS);
//   const batches = [];
//   for (let i = 0; i < products.length; i += batchSize) batches.push(products.slice(i, i + batchSize));

//   console.log(`⚡ Launching ${batches.length} workers on ${NUM_WORKERS} threads...`);
//   let totalProcessed = 0;

//   const promises = batches.map((batch, idx) =>
//     new Promise((resolve) => {
//       const worker = new Worker(new URL(import.meta.url), { workerData: { batch, allSigs, best, workerId: idx } });

//       worker.on("message", async (msg) => {
//         if (msg.type === "progress") {
//           console.log(`[Worker ${idx}] ${msg.msg}`);
//         } else if (msg.type === "done") {
//           await ProductSignature.bulkWrite(msg.updates);
//           totalProcessed += batch.length;
//           console.log(`[Worker ${idx}] Finished batch (${totalProcessed}/${products.length} total)`);
//           resolve();
//         }
//       });
//     })
//   );

//   await Promise.all(promises);
//   console.log("✅ All workers finished!");
//   await mongoose.disconnect();
// };

// if (isMainThread) run();

import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/product.model.js";
import ProductSignature from "../models/productSignature.model.js";
import crypto from "crypto";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

dotenv.config();

const K_VALUES = [2, 3, 5, 7, 10];
const HASH_VALUES = [10, 20, 50, 100, 150];
const NUM_BANDS = 20;
const MAX_HASHES = 150;
const NUM_WORKERS = 16;

// --- Shingling ---
const getCharShingles = (text, k) => {
  if (!text) return [];
  const clean = text.toLowerCase().replace(/\s+/g, " ");
  const shingles = [];
  for (let i = 0; i <= clean.length - k; i++) shingles.push(clean.slice(i, i + k));
  return shingles;
};

// --- Minhash ---
const minHash = (shingles, numHashes = MAX_HASHES) => {
  if (!shingles || shingles.length === 0) return Array(numHashes).fill(0);
  const sig = [];
  for (let i = 0; i < numHashes; i++) {
    let minVal = Infinity;
    for (const sh of shingles) {
      const hash = parseInt(
        crypto.createHash("sha256").update(sh + i).digest("hex").slice(0, 8),
        16
      );
      if (hash < minVal) minVal = hash;
    }
    sig.push(minVal);
  }
  return sig;
};

// --- LSH ---
const computeLSHBuckets = (signature, numHashes, numBands = NUM_BANDS) => {
  const rowsPerBand = Math.floor(numHashes / numBands);
  const buckets = [];
  for (let b = 0; b < numBands; b++) {
    const start = b * rowsPerBand;
    const band = signature.slice(start, start + rowsPerBand);
    if (band.length === 0) continue;
    buckets.push(band.join("-"));
  }
  return buckets;
};

// --- DB ---
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cs5600");
  console.log("✅ MongoDB connected");
};

// --- Worker logic ---
if (!isMainThread) {
  const { batch, best } = workerData;
  const { k: K, numHashes: NUM_HASHES, b: NUM_BANDS } = best;

  let processed = 0;
  const updates = batch.map(p => {
    const hybrid = ((p.title || "") + " " + (Array.isArray(p.description) ? p.description.join(" ") : p.description || "")).trim();

    const shingles = getCharShingles(hybrid, K);
    const pst_sig = minHash(shingles, NUM_HASHES);
    const psd_sig = minHash(getCharShingles(p.description?.join(" ") || "", K), NUM_HASHES);
    const pstd_sig = pst_sig;

    processed++;
    if (processed % 50 === 0 || processed === batch.length) {
      parentPort.postMessage({ type: "progress", msg: `Processed ${processed}/${batch.length}` });
    }

    return {
      updateOne: {
        filter: { asin: p.asin },
        update: {
          asin: p.asin,
          pst_sig, psd_sig, pstd_sig,
          pst_buckets: computeLSHBuckets(pst_sig, NUM_HASHES, NUM_BANDS),
          psd_buckets: computeLSHBuckets(psd_sig, NUM_HASHES, NUM_BANDS),
          pstd_buckets: computeLSHBuckets(pstd_sig, NUM_HASHES, NUM_BANDS)
        },
        upsert: true,
      },
    };
  });

  parentPort.postMessage({ type: "done", updates });
}

// --- Main thread ---
const run = async () => {
  await connectDB();
  const products = await Product.find();
  console.log(`📦 Found ${products.length} products.`);

  // --- Parallel tuning ---
  console.log("📊 Parallel tuning...");
  let best = null;

  for (const k of K_VALUES) {
    for (const numHashes of HASH_VALUES) {
      const r = Math.floor(numHashes / NUM_BANDS);
      if (r <= 0) continue;

      let overlaps = 0;
      const seenBuckets = new Map();

      // Compute minHashes in parallel using Promise.all
      await Promise.all(products.map(async (p, idx) => {
        const hybrid = ((p.title || "") + " " + (Array.isArray(p.description) ? p.description.join(" ") : p.description || "")).trim();
        const sig = minHash(getCharShingles(hybrid, k), numHashes);
        const buckets = computeLSHBuckets(sig, numHashes, NUM_BANDS);

        if (buckets.some(b => seenBuckets.has(b))) overlaps++;
        buckets.forEach(b => seenBuckets.set(b, true));

        if ((idx + 1) % 500 === 0) console.log(`Tuning: ${idx + 1}/${products.length} products processed (k=${k}, numHashes=${numHashes})`);
      }));

      const score = (1 - overlaps / products.length) * Math.min(1, r / 5);
      if (!best || score > best.score) best = { k, numHashes, r, b: NUM_BANDS, overlaps, score };
      console.log(`✅ Finished tuning k=${k}, numHashes=${numHashes}, score=${score.toFixed(4)}`);
    }
  }

  console.log("✅ Best config found:", best);

  // --- Split batches for workers ---
  const batchSize = Math.ceil(products.length / NUM_WORKERS);
  const batches = [];
  for (let i = 0; i < products.length; i += batchSize) batches.push(products.slice(i, i + batchSize));

  console.log(`⚡ Launching ${batches.length} workers on ${NUM_WORKERS} threads...`);
  let totalProcessed = 0;

  const promises = batches.map((batch, idx) =>
    new Promise((resolve) => {
      const worker = new Worker(new URL(import.meta.url), { workerData: { batch, best } });

      worker.on("message", async (msg) => {
        if (msg.type === "progress") {
          console.log(`[Worker ${idx}] ${msg.msg}`);
        } else if (msg.type === "done") {
          await ProductSignature.bulkWrite(msg.updates);
          totalProcessed += batch.length;
          console.log(`[Worker ${idx}] Finished batch (${totalProcessed}/${products.length} total)`);
          resolve();
        }
      });
    })
  );

  await Promise.all(promises);
  console.log("✅ All workers finished!");
  await mongoose.disconnect();
};

if (isMainThread) run();
