import { Router } from "express";
import multer from "multer";
import { analyzeResume } from "../controllers/ats.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { aiLimiter } from "../middleware/rateLimit.middleware.js";

const router = Router();

// Keep file in memory (I'll store in Cloudinary later)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

router.post("/analyze", protect, aiLimiter, upload.single("resume"), analyzeResume);

export default router;