import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "IdentityUser", required: true, index: true },
    product: { type: String, enum: ["academy", "tournament"], required: true, index: true },
    redirectUri: { type: String, required: true, trim: true },
    codeChallenge: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    usedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

export default mongoose.model("SsoAuthorizationCode", schema);
