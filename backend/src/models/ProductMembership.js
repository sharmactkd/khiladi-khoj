import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "IdentityUser", required: true, index: true },
    product: { type: String, enum: ["academy", "tournament"], required: true, index: true },
    legacyUserId: { type: String, required: true, trim: true },
    roles: { type: [String], default: [] },
    status: { type: String, enum: ["active", "suspended", "revoked"], default: "active", index: true },
    linkedAt: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

schema.index({ userId: 1, product: 1 }, { unique: true });
schema.index({ product: 1, legacyUserId: 1 }, { unique: true });

export default mongoose.model("ProductMembership", schema);
