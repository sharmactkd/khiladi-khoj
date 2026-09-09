import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import SsoAuthorizationCode from "../models/SsoAuthorizationCode.js";
import IdentityUser from "../models/IdentityUser.js";
import ProductMembership from "../models/ProductMembership.js";
import { createOpaqueToken, hashOpaqueToken } from "../utils/identityCrypto.js";
import { verifyPkce } from "../utils/pkce.js";

export const isAllowedRedirectUri = (product, redirectUri) =>
  Boolean(env.SSO_REDIRECT_URIS[product]?.includes(redirectUri));

export const buildSsoRedirectUrl = ({ redirectUri, code, state }) => {
  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  url.searchParams.set("state", state);
  return url.toString();
};

export const issueAuthorizationCode = async ({ userId, product, redirectUri, codeChallenge }) => {
  const code = createOpaqueToken();
  const expiresAt = new Date(Date.now() + env.AUTH_CODE_TTL_SECONDS * 1000);
  await SsoAuthorizationCode.create({
    codeHash: hashOpaqueToken(code, env.AUTH_CODE_PEPPER),
    userId,
    product,
    redirectUri,
    codeChallenge,
    expiresAt,
  });
  return { code, expiresAt };
};

export const exchangeAuthorizationCode = async ({ code, product, redirectUri, codeVerifier }) => {
  const codeHash = hashOpaqueToken(code, env.AUTH_CODE_PEPPER);
  const now = new Date();
  const pendingCode = await SsoAuthorizationCode.findOne({
    codeHash,
    product,
    redirectUri,
    usedAt: null,
    expiresAt: { $gt: now },
  });

  if (!pendingCode || !verifyPkce(codeVerifier, pendingCode.codeChallenge)) {
    const error = new Error("Authorization code is invalid, expired, or already used");
    error.statusCode = 400;
    throw error;
  }

  const consumedCode = await SsoAuthorizationCode.findOneAndUpdate(
    { _id: pendingCode._id, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { new: true },
  );
  if (!consumedCode) {
    const error = new Error("Authorization code is invalid, expired, or already used");
    error.statusCode = 400;
    throw error;
  }

  const [user, membership] = await Promise.all([
    IdentityUser.findOne({ _id: consumedCode.userId, status: "active" }),
    ProductMembership.findOne({ userId: consumedCode.userId, product, status: "active" }),
  ]);
  if (!user) {
    const error = new Error("KHILADI identity is not active");
    error.statusCode = 403;
    throw error;
  }

  const assertion = jwt.sign(
    {
      type: "khiladi_sso",
      email: user.primaryEmail,
      emailVerified: Boolean(user.emailVerifiedAt),
      name: user.name,
      picture: user.profilePicture,
      legacyUserId: membership?.legacyUserId || null,
      roles: membership?.roles || [],
    },
    env.SSO_ASSERTION_SECRETS[product],
    {
      algorithm: "HS256",
      issuer: "https://khiladi-khoj.com",
      audience: `khiladi-${product}`,
      subject: String(user._id),
      jwtid: createOpaqueToken(24),
      expiresIn: env.SSO_ASSERTION_TTL_SECONDS,
    },
  );

  return { assertion, expiresIn: env.SSO_ASSERTION_TTL_SECONDS };
};
