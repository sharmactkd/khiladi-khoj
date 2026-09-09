import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "IdentityUser", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    lastUsedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null, index: true },
    rotatedFromHash: { type: String, default: "", select: false },
    userAgent: { type: String, default: "", trim: true, maxlength: 500 },
    ipHash: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

schema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

export default mongoose.model("IdentitySession", schema);
