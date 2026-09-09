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

export const env = Object.freeze({
  NODE_ENV: nodeEnv,
  PORT: port,
  CLIENT_URLS: clientUrls,
  TRUST_PROXY: process.env.TRUST_PROXY === "true",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  IS_PRODUCTION: nodeEnv === "production",
});
