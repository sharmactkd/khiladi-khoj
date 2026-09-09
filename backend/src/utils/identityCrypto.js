import crypto from "node:crypto";

const asText = (value) => String(value || "");

export const normalizeEmail = (value) => asText(value).trim().toLowerCase();

export const createOpaqueToken = (bytes = 48) =>
  crypto.randomBytes(bytes).toString("base64url");

export const hashOpaqueToken = (token, pepper) =>
  crypto
    .createHmac("sha256", asText(pepper))
    .update(asText(token))
    .digest("hex");

export const safeTokenEqual = (left, right) => {
  const leftBuffer = Buffer.from(asText(left));
  const rightBuffer = Buffer.from(asText(right));
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};
