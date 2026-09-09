import { Router } from "express";
import rateLimit from "express-rate-limit";
import { currentIdentity, googleSignIn, logout } from "../controllers/authController.js";
import { requireTrustedMutation } from "../middlewares/identityRequestMiddleware.js";

const router = Router();
const signInLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many sign-in attempts. Please try again later." },
});

router.post("/google", signInLimiter, requireTrustedMutation, googleSignIn);
router.get("/me", currentIdentity);
router.post("/logout", requireTrustedMutation, logout);
export default router;
