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

import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/product.model.js";
import ProductSignature from "../models/productSignature.model.js";
import crypto from "crypto";

dotenv.config();

const NUM_HASHES = 40;
const NUM_BANDS = 20;
const ROWS_PER_BAND = NUM_HASHES / NUM_BANDS; // ✅ fixed: consistent with querying

// 2-shingles
const getShingles = (text) => {
  if (!text) return [];
  const words = text.toLowerCase().replace(/\s+/g, " ").split(" ");
  const shingles = [];
  for (let i = 0; i < words.length - 1; i++) {
    shingles.push(words[i] + " " + words[i + 1]);
  }
  return shingles;
};

// MinHash
const minHash = (shingles, numHashes = NUM_HASHES) => {
  if (!shingles || shingles.length === 0) {
    // Return zeros instead of Infinity when no shingles
    return Array(numHashes).fill(0);
  }
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

// LSH buckets
const computeLSHBuckets = (signature, bands = NUM_BANDS) => {
  const buckets = [];
  for (let b = 0; b < bands; b++) {
    const start = b * ROWS_PER_BAND;
    const band = signature.slice(start, start + ROWS_PER_BAND);
    if (band.length === 0) continue;
    const bucketId = band.join("-");
    buckets.push(bucketId);
  }
  return buckets;
};

// Connect DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cs5600");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  }
};

const precomputeSignatures = async () => {
  await connectDB();

  const products = await Product.find();
  console.log(`Found ${products.length} products.`);

  let count = 0;
  for (const p of products) {
    const title = p.title || "";
    const desc = Array.isArray(p.description) ? p.description.join(" ") : (p.description || "");
    const hybrid = (title + " " + desc).trim();

    const pst_sig = minHash(getShingles(title));
    const psd_sig = minHash(getShingles(desc));
    const pstd_sig = minHash(getShingles(hybrid));

    const pst_buckets = computeLSHBuckets(pst_sig);
    const psd_buckets = computeLSHBuckets(psd_sig);
    const pstd_buckets = computeLSHBuckets(pstd_sig);

    await ProductSignature.updateOne(
      { asin: p.asin },
      {
        $set: {
          asin: p.asin,
          pst_sig,
          psd_sig,
          pstd_sig,
          pst_buckets,
          psd_buckets,
          pstd_buckets,
        },
      },
      { upsert: true }
    );

    count++;
    if (count % 100 === 0 || count === products.length) {
      console.log(
        `Processed ${count}/${products.length} – asin=${p.asin}, pst_buckets=${pst_buckets.length}`
      );
    }
  }

  console.log(`\n✅ Precompute finished for ${count} products.`);
  await mongoose.disconnect();
};

precomputeSignatures();
