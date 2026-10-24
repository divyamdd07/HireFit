import { Router } from "express";
import {
  startInterview,
  getMyInterviews,
  getInterview,
  submitAnswer,
  retryReport,
} from "../controllers/interview.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.use(protect, authorize("candidate"));

router.post("/", aiLimiter, startInterview);
router.get("/mine", getMyInterviews); // "/:id" se pehle
router.get("/:id", getInterview);
router.post("/:id/answer", aiLimiter, submitAnswer);
router.post("/:id/report", retryReport);

export default router;