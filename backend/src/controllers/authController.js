import { z } from "zod";
import { identityTokenFromRequest } from "../middlewares/identityRequestMiddleware.js";
import { createIdentitySession, findOrCreateGoogleUser, getIdentityContext, revokeIdentitySession } from "../services/identityAuthService.js";
import { verifyGoogleCredential } from "../services/googleIdentityService.js";
import { clearIdentityCookie, setIdentityCookie } from "../utils/identityCookie.js";

const googleSchema = z.object({ credential: z.string().min(100).max(10_000) }).strict();
const publicUser = (user, memberships = []) => ({
  id: String(user._id), name: user.name, email: user.primaryEmail, picture: user.profilePicture,
  memberships: memberships.map(({ product, roles }) => ({ product, roles })),
});

export const googleSignIn = async (request, response) => {
  const parsed = googleSchema.safeParse(request.body);
  if (!parsed.success) {
    const error = new Error("A valid Google credential is required");
    error.statusCode = 400;
    throw error;
  }
  const user = await findOrCreateGoogleUser(await verifyGoogleCredential(parsed.data.credential));
  const session = await createIdentitySession({ userId: user._id, userAgent: request.get("user-agent") });
  setIdentityCookie(response, session.token, session.expiresAt);
  response.set("Cache-Control", "no-store").json({ success: true, data: { user: publicUser(user) } });
};

export const currentIdentity = async (request, response) => {
  const context = await getIdentityContext(identityTokenFromRequest(request));
  if (!context) {
    response.set("Cache-Control", "no-store").status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  response.set("Cache-Control", "no-store").json({
    success: true,
    data: { user: publicUser(context.user, context.memberships) },
  });
};

export const logout = async (request, response) => {
  await revokeIdentitySession(identityTokenFromRequest(request));
  clearIdentityCookie(response);
  response.set("Cache-Control", "no-store").status(204).end();
};
