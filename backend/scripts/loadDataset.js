import fs from "fs";
import zlib from "zlib";
import readline from "readline";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/product.model.js";

dotenv.config();

const DATASET_PATH = "../data/meta_Appliances.json.gz";

const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/cs5600"
    );
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ DB connection error:", err.message);
    process.exit(1);
  }
};

const loadDataset = async () => {
  await connectDB();

  const gunzip = zlib.createGunzip();
  const stream = fs.createReadStream(DATASET_PATH).pipe(gunzip);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let count = 0;
  let skipped = 0;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);

      // Insert into MongoDB using schema (skip duplicates)
      await Product.create(obj);
      count++;

      if (count % 1000 === 0) {
        console.log(`Inserted ${count} products...`);
      }
    } catch (err) {
      if (err.code === 11000) {
        // Duplicate key error
        skipped++;
        continue;
      } else {
        console.error("Parse/Insert error:", err.message);
        break;
      }
    }
  }

  console.log(
    `\n✅ Finished inserting ${count} products (Skipped duplicates: ${skipped})`
  );
  mongoose.disconnect();
};

loadDataset();