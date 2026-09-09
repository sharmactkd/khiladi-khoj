import { z } from "zod";
import { identityTokenFromRequest } from "../middlewares/identityRequestMiddleware.js";
import { getIdentityContext } from "../services/identityAuthService.js";
import {
  buildSsoRedirectUrl,
  exchangeAuthorizationCode,
  isAllowedRedirectUri,
  issueAuthorizationCode,
} from "../services/ssoProtocolService.js";
import { isValidPkceChallenge, isValidPkceVerifier } from "../utils/pkce.js";

const productSchema = z.enum(["academy", "tournament"]);
const authorizeSchema = z.object({
  product: productSchema,
  redirectUri: z.string().url().max(500),
  codeChallenge: z.string().refine(isValidPkceChallenge),
  state: z.string().min(16).max(512),
}).strict();
const exchangeSchema = z.object({
  code: z.string().min(64).max(200),
  product: productSchema,
  redirectUri: z.string().url().max(500),
  codeVerifier: z.string().refine(isValidPkceVerifier),
}).strict();

const badRequest = (message) => Object.assign(new Error(message), { statusCode: 400 });

export const authorizeProduct = async (request, response) => {
  const parsed = authorizeSchema.safeParse(request.body);
  if (!parsed.success) throw badRequest("A valid SSO authorization request is required");
  const { product, redirectUri, codeChallenge, state } = parsed.data;
  if (!isAllowedRedirectUri(product, redirectUri)) throw badRequest("Redirect URI is not allowed for this product");
  const identity = await getIdentityContext(identityTokenFromRequest(request));
  if (!identity) {
    response.set("Cache-Control", "no-store").status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  const issued = await issueAuthorizationCode({ userId: identity.user._id, product, redirectUri, codeChallenge });
  response.set("Cache-Control", "no-store").status(201).json({
    success: true,
    data: {
      redirectUrl: buildSsoRedirectUrl({ redirectUri, code: issued.code, state }),
      expiresAt: issued.expiresAt.toISOString(),
    },
  });
};

export const exchangeProductCode = async (request, response) => {
  const parsed = exchangeSchema.safeParse(request.body);
  if (!parsed.success) throw badRequest("A valid SSO code exchange request is required");
  if (!isAllowedRedirectUri(parsed.data.product, parsed.data.redirectUri)) {
    throw badRequest("Redirect URI is not allowed for this product");
  }
  const result = await exchangeAuthorizationCode(parsed.data);
  response.set("Cache-Control", "no-store").json({ success: true, data: result });
};
