import { Router } from "express";
import { getMyIntelligence, createRoadmap } from "../controllers/intelligence.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.use(protect, authorize("candidate"));

router.get("/me", getMyIntelligence);
router.post("/roadmap", aiLimiter, createRoadmap);

export default router;