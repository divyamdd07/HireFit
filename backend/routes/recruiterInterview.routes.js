import { Router } from "express";
import {
  scheduleInterview,
  getMyInterviews,
  getInterview,
  saveDraft,
  generateQuestions,
  generateSummary,
  completeInterview,
  cancelInterview,
  getMySchedule,
} from "../controllers/recruiterInterview.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();
const recruiterOnly = [protect, authorize("recruiter")];

router.get("/schedule", protect, authorize("candidate"), getMySchedule); // candidate ke liye

router.post("/", ...recruiterOnly, scheduleInterview);
router.get("/mine", ...recruiterOnly, getMyInterviews); // "/:id" se pehle
router.get("/:id", ...recruiterOnly, getInterview);
router.patch("/:id", ...recruiterOnly, saveDraft);
router.post("/:id/suggest-questions", ...recruiterOnly, aiLimiter, generateQuestions);
router.post("/:id/summarize", ...recruiterOnly, aiLimiter, generateSummary);
router.post("/:id/complete", ...recruiterOnly, completeInterview);
router.patch("/:id/cancel", ...recruiterOnly, cancelInterview);

export default router;