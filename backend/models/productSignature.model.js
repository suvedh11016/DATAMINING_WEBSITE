// import mongoose from "mongoose";

// const productSignatureSchema = new mongoose.Schema(
//   {
//     asin: { type: String, required: true, unique: true },
//     pst_sig: [{ type: Number }],   // title signature
//     psd_sig: [{ type: Number }],   // description signature
//     pstd_sig: [{ type: Number }],  // title+description signature
//     pst_buckets: [String],         // candidate LSH buckets for PST
//     psd_buckets: [String],         // candidate LSH buckets for PSD
//     pstd_buckets: [String],        // candidate LSH buckets for PSTD
//     similar: [
//       {
//         asin: String,
//         score: Number
//       }
//     ]
//   },
//   { timestamps: true }
// );

// export default mongoose.model("ProductSignature", productSignatureSchema);

import mongoose from "mongoose";
import mongooseLong from "mongoose-long";

mongooseLong(mongoose);
const { Long } = mongoose.Schema.Types;

const productSignatureSchema = new mongoose.Schema({
  asin: { type: String, required: true, unique: true },
  similar: {
    pst: [{ asin: String, score: Number }],
    psd: [{ asin: String, score: Number }],
    pstd: [{ asin: String, score: Number }]
  }
});

export default mongoose.model("ProductSignature", productSignatureSchema);
