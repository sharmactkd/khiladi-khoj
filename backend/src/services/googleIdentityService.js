import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { normalizeEmail } from "../utils/identityCrypto.js";

const googleClient = new OAuth2Client();

export const verifyGoogleCredential = async (credential) => {
  const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    const error = new Error("Google account could not be verified");
    error.statusCode = 401;
    throw error;
  }
  return {
    subject: payload.sub,
    email: normalizeEmail(payload.email),
    name: String(payload.name || payload.email.split("@")[0]).trim().slice(0, 80),
    picture: String(payload.picture || "").trim(),
  };
};
