import { Router } from "express";
import {
  createAssessment,
  getMyAssessments,
  getAssessment,
  setStatus,
  generateSuggestions,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "../controllers/assessment.controller.js";
import { protect, authorize, requireVerifiedRecruiter } from "../middleware/auth.middleware.js";
import { getAssessmentResults, getAttemptDetail } from "../controllers/result.controller.js";
import { aiLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

// Is file ke sab routes sirf logged-in recruiter ke liye
router.use(protect, authorize("recruiter"),requireVerifiedRecruiter);
router.get("/:id/results", getAssessmentResults);
router.get("/:id/results/:attemptId", getAttemptDetail);
router.post("/", createAssessment);
router.get("/mine", getMyAssessments); // "/:id" se pehle
router.get("/:id", getAssessment);
router.patch("/:id/status", setStatus);
router.post("/:id/generate", aiLimiter, generateSuggestions);
router.post("/:id/questions", addQuestion);
router.put("/:id/questions/:qid", updateQuestion);
router.delete("/:id/questions/:qid", deleteQuestion);


export default router;