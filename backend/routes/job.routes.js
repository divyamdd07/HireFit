import { Router } from "express";
import {
  createJob,
  getOpenJobs,
  getMyJobs,
  toggleJobStatus,
} from "../controllers/job.controller.js";
import { protect, authorize, requireVerifiedRecruiter } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protect, getOpenJobs);
router.get("/mine", protect, authorize("recruiter"), requireVerifiedRecruiter, getMyJobs); // "/:id" se pehle
router.post("/", protect, authorize("recruiter"), requireVerifiedRecruiter, createJob);
router.patch("/:id/status", protect, authorize("recruiter"), requireVerifiedRecruiter, toggleJobStatus);

export default router;