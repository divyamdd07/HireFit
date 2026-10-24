import { Router } from "express";
import {
  createJob,
  getOpenJobs,
  getMyJobs,
  toggleJobStatus,
} from "../controllers/job.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protect, getOpenJobs);
router.get("/mine", protect, authorize("recruiter"), getMyJobs); // "/:id" se pehle likhna zaroori
router.post("/", protect, authorize("recruiter"), createJob);
router.patch("/:id/status", protect, authorize("recruiter"), toggleJobStatus);

export default router;