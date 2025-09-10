// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import dotenv from "dotenv";
// import Product from "../models/product.model.js";
// import ProductSignature from "../models/productSignature.model.js";

// dotenv.config();
// const app = express();
// app.use(cors());
// app.use(express.json());

// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cs5600";

// // Connect to MongoDB
// mongoose.connect(MONGO_URI)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("❌ DB connection error:", err.message));

// // Routes
// // app.get("/products", async (req, res) => {
// //   try {
// //     const products = await Product.find().limit(48); // fetch first 50 products
// //     res.json(products);
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });
// // GET /products?page=1&limit=50
// // app.get("/products", async (req, res) => {
// //     try {
// //       const page = parseInt(req.query.page) || 1;
// //       const limit = parseInt(req.query.limit) || 48;
// //       const skip = (page - 1) * limit;
  
// //       const products = await Product.find().skip(skip).limit(limit);
// //       const total = await Product.countDocuments(); // total products for frontend pagination
  
// //       res.json({
// //         products,
// //         total,
// //         page,
// //         totalPages: Math.ceil(total / limit),
// //       });
// //     } catch (err) {
// //       res.status(500).json({ error: err.message });
// //     }
// //   });

// // GET /products?page=1&limit=50&search=keyword
// app.get("/products", async (req, res) => {
//     try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 48;
//       const skip = (page - 1) * limit;
//       const search = req.query.search || "";
  
//       let filter = {};
//       if (search) {
//         // Search on 'title' field with regex
//         filter = { title: { $regex: search, $options: "i" } };
//       }
  
//       const products = await Product.find(filter).skip(skip).limit(limit);
//       const total = await Product.countDocuments(filter); // total products after search
  
//       res.json({
//         products,
//         total,
//         page,
//         totalPages: Math.ceil(total / limit),
//       });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });
  
  
// // Get single product
// app.get("/products/:asin", async (req, res) => {
//     try {
//       const product = await Product.findOne({ asin: req.params.asin });
//       if (!product) return res.status(404).json({ error: "Not found" });
//       res.json(product);
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });

// // Jaccard similarity
// const jaccardSim = (sigA, sigB) => {
//   let matches = 0;
//   for (let i = 0; i < sigA.length; i++) if (sigA[i] === sigB[i]) matches++;
//   return matches / sigA.length;
// };

// // LSH candidate retrieval
// const getCandidates = async (mode, targetBuckets) => {
//   const filter = {};
//   filter[`${mode.toLowerCase()}_buckets`] = {
//     $elemMatch: { $in: targetBuckets.flat() }
//   };
//   return await ProductSignature.find(filter);
// };


// // Similar products route
// app.get("/products/:asin/similar", async (req, res) => {
//   try {
//     const { asin } = req.params;
//     const { mode } = req.query;

//     if (!["PST", "PSD", "PSTD"].includes(mode))
//       return res.status(400).json({ error: "Invalid mode" });

//     const sigDoc = await ProductSignature.findOne({ asin });
//     if (!sigDoc) return res.status(404).json({ error: "Signature not found" });

//     let sigField = "pst_sig";
//     let bucketField = "pst_buckets";
//     if (mode === "PSD") { sigField = "psd_sig"; bucketField = "psd_buckets"; }
//     else if (mode === "PSTD") { sigField = "pstd_sig"; bucketField = "pstd_buckets"; }

//     const targetSig = sigDoc[sigField];
//     const targetBuckets = sigDoc[bucketField];

//     const candidates = await getCandidates(mode, targetBuckets);

//     const sims = [];
//     for (const c of candidates) {
//       if (c.asin === asin) continue;
//       sims.push({ asin: c.asin, sim: jaccardSim(targetSig, c[sigField]) });
//     }

//     sims.sort((a, b) => b.sim - a.sim);
//     const top10 = sims.slice(0, 10);

//     const products = await Product.find({ asin: { $in: top10.map(x => x.asin) } })
//       .select("asin title imageURLHighRes");

//     const sortedProducts = top10.map(x => products.find(p => p.asin === x.asin));

//     res.json(sortedProducts);
//     console.log(`Fetching candidates for ${mode}, targetBuckets:`, targetBuckets.flat());

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });



// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Product from "../models/product.model.js";
import ProductSignature from "../models/productSignature.model.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cs5600";

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB connection error:", err.message));

// GET /products?page=1&limit=50&search=keyword
app.get("/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 48;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    let filter = {};
    if (search) {
      filter = { title: { $regex: search, $options: "i" } };
    }

    const products = await Product.find(filter).skip(skip).limit(limit);
    const total = await Product.countDocuments(filter);

    res.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/products/bulk", async (req, res) => {
  try {
    const asins = (req.query.asins || "").split(",").filter(Boolean);
    console.log("➡️ Incoming bulk request ASINs:", asins);

    if (asins.length === 0) {
      console.log("⚠️ No ASINs provided");
      return res.json([]);
    }

    const products = await Product.find({ asin: { $in: asins } })
      .select("asin title imageURLHighRes imageURL");
    console.log("📦 Mongo returned products:", products.length);

    // Preserve order
    const asinMap = {};
    products.forEach((p) => {
      asinMap[p.asin] = p;
    });
    const ordered = asins.map((a) => asinMap[a]).filter(Boolean);
    console.log("✅ Ordered products to return:", ordered.length);

    res.json(ordered);
  } catch (err) {
    console.error("❌ Bulk fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET single product
app.get("/products/:asin", async (req, res) => {
  try {
    const product = await Product.findOne({ asin: req.params.asin });
    if (!product) return res.status(404).json({ error: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET bulk products by asin list



// Jaccard similarity
const jaccardSim = (sigA, sigB) => {
  let matches = 0;
  for (let i = 0; i < sigA.length; i++) if (sigA[i] === sigB[i]) matches++;
  return (matches + 1) / (sigA.length + 2);
};

// GET /products/:asin/similar?mode=PST|PSD|PSTD
app.get("/products/:asin/similar", async (req, res) => {
  try {
    const { asin } = req.params;
    const { mode } = req.query;

    if (!["PST", "PSD", "PSTD"].includes(mode))
      return res.status(400).json({ error: "Invalid mode" });

    const sigDoc = await ProductSignature.findOne({ asin });
    if (!sigDoc) return res.status(404).json({ error: "Signature not found" });

    let sigField = "pst_sig";
    let bucketField = "pst_buckets";
    if (mode === "PSD") {
      sigField = "psd_sig";
      bucketField = "psd_buckets";
    } else if (mode === "PSTD") {
      sigField = "pstd_sig";
      bucketField = "pstd_buckets";
    }

    const targetSig = sigDoc[sigField];
    const targetBuckets = sigDoc[bucketField];

    const candidates = await ProductSignature.find({
      [bucketField]: { $in: targetBuckets },
    });

    const sims = candidates
      .filter((c) => c.asin !== asin)
      .map((c) => ({ asin: c.asin, sim: jaccardSim(targetSig, c[sigField]) }));

    sims.sort((a, b) => b.sim - a.sim);
    const top10 = sims.slice(0, 10);

    const products = await Product.find({
      asin: { $in: top10.map((x) => x.asin) },
    }).select("asin title imageURLHighRes");

    const sortedProducts = top10.map((x) =>
      products.find((p) => p.asin === x.asin)
    );

    res.json(sortedProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
