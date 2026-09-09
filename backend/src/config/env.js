import "dotenv/config";

const allowedEnvironments = new Set(["development", "test", "production"]);
const nodeEnv = process.env.NODE_ENV || "development";
const port = Number(process.env.PORT || 5000);

if (!allowedEnvironments.has(nodeEnv)) {
  throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid number between 1 and 65535");
}

const clientUrls = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const readSecret = (name) => String(process.env[name] || "").trim();

const parseUrlList = (name, fallback = "") =>
  String(process.env[name] || fallback)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

const parsePositiveInteger = (name, fallback) => {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
};

export const env = Object.freeze({
  NODE_ENV: nodeEnv,
  PORT: port,
  CLIENT_URLS: clientUrls,
  TRUST_PROXY: process.env.TRUST_PROXY === "true",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  IS_PRODUCTION: nodeEnv === "production",
  MONGODB_URI: readSecret("MONGODB_URI"),
  JWT_ACCESS_SECRET: readSecret("JWT_ACCESS_SECRET"),
  SESSION_TOKEN_PEPPER: readSecret("SESSION_TOKEN_PEPPER"),
  AUTH_CODE_PEPPER: readSecret("AUTH_CODE_PEPPER"),
  GOOGLE_CLIENT_ID: readSecret("GOOGLE_CLIENT_ID"),
  IDENTITY_COOKIE_NAME:
    readSecret("IDENTITY_COOKIE_NAME") ||
    (nodeEnv === "production"
      ? "__Host-khiladi_identity"
      : "khiladi_identity_dev"),
  SSO_REDIRECT_URIS: Object.freeze({
    academy: parseUrlList(
      "ACADEMY_SSO_REDIRECT_URIS",
      nodeEnv === "production" ? "" : "http://localhost:5173/auth/sso/callback",
    ),
    tournament: parseUrlList(
      "TOURNAMENT_SSO_REDIRECT_URIS",
      nodeEnv === "production" ? "" : "http://localhost:5173/auth/sso/callback",
    ),
  }),
  SSO_ASSERTION_SECRETS: Object.freeze({
    academy: readSecret("ACADEMY_SSO_ASSERTION_SECRET"),
    tournament: readSecret("TOURNAMENT_SSO_ASSERTION_SECRET"),
  }),
  ACCESS_TOKEN_TTL_MINUTES: parsePositiveInteger(
    "ACCESS_TOKEN_TTL_MINUTES",
    10,
  ),
  SESSION_TTL_DAYS: parsePositiveInteger("SESSION_TTL_DAYS", 30),
  AUTH_CODE_TTL_SECONDS: parsePositiveInteger("AUTH_CODE_TTL_SECONDS", 90),
  SSO_ASSERTION_TTL_SECONDS: parsePositiveInteger(
    "SSO_ASSERTION_TTL_SECONDS",
    120,
  ),
});

export const assertIdentityRuntimeConfiguration = () => {
  const required = [
    "MONGODB_URI",
    "JWT_ACCESS_SECRET",
    "SESSION_TOKEN_PEPPER",
    "AUTH_CODE_PEPPER",
    "GOOGLE_CLIENT_ID",
  ];

  const missing = required.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing identity configuration: ${missing.join(", ")}`);
  }

  const secretNames = [
    "JWT_ACCESS_SECRET",
    "SESSION_TOKEN_PEPPER",
    "AUTH_CODE_PEPPER",
  ];

  for (const name of secretNames) {
    if (env[name].length < 32) {
      throw new Error(`${name} must contain at least 32 characters`);
    }
  }

  const secrets = secretNames.map((name) => env[name]);
  if (new Set(secrets).size !== secrets.length) {
    throw new Error("Identity cryptographic secrets must be unique");
  }

  if (env.IS_PRODUCTION) {
    for (const [product, redirectUris] of Object.entries(env.SSO_REDIRECT_URIS)) {
      if (redirectUris.length === 0) {
        throw new Error(`${product.toUpperCase()}_SSO_REDIRECT_URIS is required in production`);
      }
    }
    const assertionSecrets = Object.values(env.SSO_ASSERTION_SECRETS);
    if (assertionSecrets.some((value) => value.length < 32)) {
      throw new Error("Product SSO assertion secrets must contain at least 32 characters");
    }
    if (new Set([...secrets, ...assertionSecrets]).size !== secrets.length + assertionSecrets.length) {
      throw new Error("Product SSO assertion secrets must be unique");
    }
  }
};
