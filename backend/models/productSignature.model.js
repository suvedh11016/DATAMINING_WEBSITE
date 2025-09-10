import mongoose from "mongoose";

const productSignatureSchema = new mongoose.Schema(
  {
    asin: { type: String, required: true, unique: true },
    pst_sig: [{ type: Number }],   // title signature
    psd_sig: [{ type: Number }],   // description signature
    pstd_sig: [{ type: Number }],  // title+description signature
    pst_buckets: [String],         // candidate LSH buckets for PST
    psd_buckets: [String],         // candidate LSH buckets for PSD
    pstd_buckets: [String],        // candidate LSH buckets for PSTD
  },
  { timestamps: true }
);

export default mongoose.model("ProductSignature", productSignatureSchema);
