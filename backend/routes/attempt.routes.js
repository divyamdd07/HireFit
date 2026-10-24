import { Router } from "express";
import { runLimiter } from "../middleware/rateLimit.middleware.js";
import {
  getAvailable,
  startAttempt,
  getAttempt,
  saveMcqAnswer,
  runSample,
  submitSolution,
  finishAttempt,
} from "../controllers/attempt.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, authorize("candidate"));

router.get("/available", getAvailable); // "/:id" se pehle
router.post("/start/:assessmentId", startAttempt);
router.get("/:id", getAttempt);
router.put("/:id/answers/:qid", saveMcqAnswer);
router.post("/:id/questions/:qid/run", runLimiter, runSample);
router.post("/:id/questions/:qid/submit", runLimiter, submitSolution);
router.post("/:id/finish", finishAttempt);
export default router;