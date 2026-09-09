import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authorizeProduct, exchangeProductCode } from "../controllers/ssoController.js";
import { requireTrustedMutation } from "../middlewares/identityRequestMiddleware.js";

const router = Router();
const authorizationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many SSO authorization attempts" },
});
const exchangeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many SSO code exchange attempts" },
});

router.post("/authorize", authorizationLimiter, requireTrustedMutation, authorizeProduct);
router.post("/exchange", exchangeLimiter, requireTrustedMutation, exchangeProductCode);
export default router;
