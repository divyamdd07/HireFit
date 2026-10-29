import { Router } from "express";
import {
  getAdminStats,
  listUsers,
  updateUser,
  listAllJobs,
  toggleJob,
} from "../controllers/admin.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import {
  listRecruiters, getRecruiter, decideRecruiter, listAuditLogs,
} from "../controllers/recruiterAdmin.controller.js";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/stats", getAdminStats);
router.get("/users", listUsers);
router.patch("/users/:id", updateUser);
router.get("/jobs", listAllJobs);
router.patch("/jobs/:id/status", toggleJob);
router.get("/recruiters", listRecruiters);
router.get("/recruiters/:id", getRecruiter);
router.patch("/recruiters/:id/decision", decideRecruiter);
router.get("/audit-logs", listAuditLogs);

export default router;