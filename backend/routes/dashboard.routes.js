import { Router } from "express";
import { getRecruiterDashboard } from "../controllers/dashboard.controller.js";
import { protect, authorize, requireVerifiedRecruiter } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/recruiter", protect, authorize("recruiter"), requireVerifiedRecruiter, getRecruiterDashboard);

export default router;