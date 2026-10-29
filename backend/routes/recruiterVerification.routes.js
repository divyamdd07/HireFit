import { Router } from "express";
import { getMine, resubmit, checkDomain } from "../controllers/recruiterVerification.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { verifyLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.use(protect, authorize("recruiter"));

router.get("/me", getMine);
router.post("/resubmit", verifyLimiter, resubmit);
router.post("/check-domain", verifyLimiter, checkDomain);

export default router;