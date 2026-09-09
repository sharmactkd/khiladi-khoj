import mongoose from "mongoose";

const providerSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ["google"], required: true },
    subject: { type: String, required: true, trim: true },
    emailAtLink: { type: String, default: "", trim: true, lowercase: true },
    linkedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const identityUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    primaryEmail: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, default: "", select: false },
    emailVerifiedAt: { type: Date, default: null },
    profilePicture: { type: String, default: "", trim: true },
    providers: { type: [providerSchema], default: [] },
    status: { type: String, enum: ["active", "suspended", "deleted"], default: "active", index: true },
    passwordChangedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

identityUserSchema.index(
  { "providers.provider": 1, "providers.subject": 1 },
  { unique: true, sparse: true },
);

export default mongoose.model("IdentityUser", identityUserSchema);
