// import mongoose from "mongoose";

// const productSchema = new mongoose.Schema(
//   {
//     asin: { type: String, required: true, unique: true }, // Product ID
//     title: { type: String }, // Product title
//     feature: [{ type: String }], // Array of feature strings
//     description: [{ type: String }], // Product description
//     price: { type: String }, // Price (can be null sometimes)
//     imageURL: [{ type: String }], // Image URLs (array)
//     imageURLHighRes: [{ type: String }], // High-res images (array)
//     also_buy: [{ type: String }], // Related products
//     also_view: [{ type: String }], // Viewed products
//     brand: { type: String }, // Brand name
//     rank: mongoose.Schema.Types.Mixed, // Sales rank (varies in format)
//     category: [[String]], // Nested category arrays
//     tech1: { type: String }, // Technical detail 1
//     tech2: { type: String }, // Technical detail 2
//     similar_item: [{ type: String }], // Similar product list
//     date: { type: String }, // Crawl date if provided
//     main_cat: { type: String }, // Main category
//     fit: { type: String }, // Fit information (clothes, etc.)
//     details: mongoose.Schema.Types.Mixed, // Extra details object (if present)
//     similar_asins: [{ type: String }], // Similar product list
//   },
//   { timestamps: true, strict: false }
// );

// export default mongoose.model("Product", productSchema);

import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    asin: { type: String, required: true, unique: true }, // Product ID
    title: { type: String }, // Product title
    feature: [{ type: String }], // Array of feature strings
    description: [{ type: String }], // Product description
    price: { type: String }, // Price (can be null sometimes)
    imageURL: [{ type: String }], // Image URLs (array)
    imageURLHighRes: [{ type: String }], // High-res images (array)
    also_buy: [{ type: String }], // Related products
    also_view: [{ type: String }], // Viewed products
    brand: { type: String }, // Brand name
    rank: mongoose.Schema.Types.Mixed, // Sales rank (varies in format)
    category: [{ type: String }], // Categories (array of strings)
    tech1: { type: mongoose.Schema.Types.Mixed, default: {} }, // Technical details (varies in format)
    tech2: { type: mongoose.Schema.Types.Mixed, default: {} }, // Technical details (varies in format)
    similar_item: [{ type: mongoose.Schema.Types.Mixed, default: {} }], // Similar items (array of objects)
    similar_item_ids: [{ type: String }], // Similar products by ASINs
    date: { type: String }, // Crawl date if provided
    main_cat: { type: String }, // Main category
    fit: { type: String }, // Fit information (clothes, etc.)
    details: mongoose.Schema.Types.Mixed, // Extra details object (if present)
  },
  { timestamps: true, strict: false, minimize: false }
);

export default mongoose.model("Product", productSchema);