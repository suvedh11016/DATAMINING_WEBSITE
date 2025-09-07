import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Product from "../models/product.model.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cs5600";

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ DB connection error:", err.message));

// Routes
// app.get("/products", async (req, res) => {
//   try {
//     const products = await Product.find().limit(48); // fetch first 50 products
//     res.json(products);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
// GET /products?page=1&limit=50
// app.get("/products", async (req, res) => {
//     try {
//       const page = parseInt(req.query.page) || 1;
//       const limit = parseInt(req.query.limit) || 48;
//       const skip = (page - 1) * limit;
  
//       const products = await Product.find().skip(skip).limit(limit);
//       const total = await Product.countDocuments(); // total products for frontend pagination
  
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

// GET /products?page=1&limit=50&search=keyword
app.get("/products", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 48;
      const skip = (page - 1) * limit;
      const search = req.query.search || "";
  
      let filter = {};
      if (search) {
        // Search on 'title' field with regex
        filter = { title: { $regex: search, $options: "i" } };
      }
  
      const products = await Product.find(filter).skip(skip).limit(limit);
      const total = await Product.countDocuments(filter); // total products after search
  
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
  
  
// Get single product
app.get("/products/:asin", async (req, res) => {
    try {
      const product = await Product.findOne({ asin: req.params.asin });
      if (!product) return res.status(404).json({ error: "Not found" });
      res.json(product);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
