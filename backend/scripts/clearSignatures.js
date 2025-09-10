import mongoose from "mongoose";
import dotenv from "dotenv";
import ProductSignature from "../models/productSignature.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cs5600";

const clearSignatures = async () => {
  await mongoose.connect(MONGO_URI);
  await ProductSignature.deleteMany({});
  console.log("✅ All ProductSignature documents deleted");
  mongoose.disconnect();
};

clearSignatures();
