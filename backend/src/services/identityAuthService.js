import { env } from "../config/env.js";
import IdentitySession from "../models/IdentitySession.js";
import IdentityUser from "../models/IdentityUser.js";
import ProductMembership from "../models/ProductMembership.js";
import { createOpaqueToken, hashOpaqueToken } from "../utils/identityCrypto.js";

export const findOrCreateGoogleUser = async ({ subject, email, name, picture }) => {
  let user = await IdentityUser.findOne({ providers: { $elemMatch: { provider: "google", subject } } });
  if (user) {
    if (user.status !== "active") {
      const error = new Error("This KHILADI account is not active");
      error.statusCode = 403;
      throw error;
    }
    user.name = name || user.name;
    user.profilePicture = picture || user.profilePicture;
    user.lastLoginAt = new Date();
    await user.save();
    return user;
  }

  if (await IdentityUser.exists({ primaryEmail: email })) {
    const error = new Error("Existing account must be linked before Google sign-in");
    error.statusCode = 409;
    throw error;
  }

  try {
    return await IdentityUser.create({
      name,
      primaryEmail: email,
      emailVerifiedAt: new Date(),
      profilePicture: picture,
      providers: [{ provider: "google", subject, emailAtLink: email }],
      lastLoginAt: new Date(),
    });
  } catch (error) {
    if (error?.code === 11000) {
      const concurrentUser = await IdentityUser.findOne({ providers: { $elemMatch: { provider: "google", subject } } });
      if (concurrentUser) return concurrentUser;
    }
    throw error;
  }
};

export const createIdentitySession = async ({ userId, userAgent }) => {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 86_400_000);
  await IdentitySession.create({
    userId,
    tokenHash: hashOpaqueToken(token, env.SESSION_TOKEN_PEPPER),
    expiresAt,
    userAgent: String(userAgent || "").slice(0, 500),
  });
  return { token, expiresAt };
};

export const getIdentityContext = async (token) => {
  if (!token) return null;
  const now = new Date();
  const session = await IdentitySession.findOne({
    tokenHash: hashOpaqueToken(token, env.SESSION_TOKEN_PEPPER),
    revokedAt: null,
    expiresAt: { $gt: now },
  }).populate("userId");
  if (!session?.userId || session.userId.status !== "active") return null;
  session.lastUsedAt = now;
  await session.save();
  const memberships = await ProductMembership.find({ userId: session.userId._id, status: "active" })
    .select("product roles legacyUserId");
  return { user: session.userId, memberships };
};

export const revokeIdentitySession = async (token) => {
  if (!token) return;
  await IdentitySession.updateOne(
    { tokenHash: hashOpaqueToken(token, env.SESSION_TOKEN_PEPPER), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
};
