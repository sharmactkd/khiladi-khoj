import { env } from "../config/env.js";

export const requireTrustedMutation = (request, _response, next) => {
  if (request.get("X-Khiladi-Request") !== "identity-v1") {
    const error = new Error("Trusted request header is required");
    error.statusCode = 403;
    next(error);
    return;
  }
  next();
};

export const identityTokenFromRequest = (request) =>
  request.cookies?.[env.IDENTITY_COOKIE_NAME] || "";
