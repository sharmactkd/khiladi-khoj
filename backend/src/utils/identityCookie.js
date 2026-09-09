import { env } from "../config/env.js";

export const identityCookieOptions = ({ expires } = {}) => ({
  httpOnly: true,
  secure: env.IS_PRODUCTION,
  sameSite: "lax",
  path: "/",
  ...(expires ? { expires } : {}),
});

export const setIdentityCookie = (response, token, expires) =>
  response.cookie(env.IDENTITY_COOKIE_NAME, token, identityCookieOptions({ expires }));

export const clearIdentityCookie = (response) =>
  response.clearCookie(env.IDENTITY_COOKIE_NAME, identityCookieOptions());
