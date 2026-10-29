import { Router } from "express";
import {
  register, login, getMe, verifyEmail, resendVerification,
} from "../controllers/auth.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { verifyLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.post("/verify-email", verifyLimiter, verifyEmail);
router.post("/resend-verification", protect, authorize("recruiter"), verifyLimiter, resendVerification);

export default router;