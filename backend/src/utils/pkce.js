import crypto from "node:crypto";
import { safeTokenEqual } from "./identityCrypto.js";

const verifierPattern = /^[A-Za-z0-9._~-]{43,128}$/;
const challengePattern = /^[A-Za-z0-9_-]{43}$/;

export const isValidPkceVerifier = (value) => verifierPattern.test(String(value || ""));
export const isValidPkceChallenge = (value) => challengePattern.test(String(value || ""));
export const createPkceChallenge = (verifier) =>
  crypto.createHash("sha256").update(String(verifier || ""), "ascii").digest("base64url");
export const verifyPkce = (verifier, expectedChallenge) =>
  isValidPkceVerifier(verifier) &&
  isValidPkceChallenge(expectedChallenge) &&
  safeTokenEqual(createPkceChallenge(verifier), expectedChallenge);
