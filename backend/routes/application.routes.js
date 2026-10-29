import { Router } from "express";
import {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
  downloadResume,
} from "../controllers/application.controller.js";
import { protect, authorize,requireVerifiedRecruiter } from "../middleware/auth.middleware.js";
import { uploadResume } from "../middleware/upload.middleware.js";
import { aiLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/apply/:jobId", protect, authorize("candidate"), aiLimiter, uploadResume.single("resume"), applyToJob);
router.get("/mine", protect, authorize("candidate"), getMyApplications);
router.get("/:id/resume", protect, downloadResume);
router.get("/job/:jobId", protect, authorize("recruiter"), requireVerifiedRecruiter, getJobApplicants);
router.patch("/:id/status", protect, authorize("recruiter"), requireVerifiedRecruiter, updateApplicationStatus);

export default router;