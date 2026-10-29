import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";
import { initSocket } from "./config/socket.js";
import { allowedOrigins } from "./config/cors.js";
import { generalLimiter, authLimiter } from "./middleware/rateLimit.middleware.js";
import { checkExecutionEnvironment } from "./services/execution/index.js";
import { verifyEmailSetup } from "./services/email.service.js";

import authRoutes from "./routes/auth.routes.js";
import atsRoutes from "./routes/ats.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import attemptRoutes from "./routes/attempt.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import intelligenceRoutes from "./routes/intelligence.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import recruiterInterviewRoutes from "./routes/recruiterInterview.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import recruiterVerificationRoutes from "./routes/recruiterVerification.routes.js";

const app = express();

// Render/Vercel jaise hosts proxy ke peeche hote hain. Iske bina rate limit
// sabko ek hi IP samajhta hai
app.set("trust proxy", 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "1mb" }));

// Health check: hosting platform aur tum check kar sakte ho ki server zinda hai
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api", generalLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/ats", atsRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/intelligence", intelligenceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/recruiter-interviews", recruiterInterviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/recruiter-verification", recruiterVerificationRoutes);
app.use("/api", (req, res) => res.status(404).json({ message: "Route not found." }));

// Central error handler
app.use((err, req, res, next) => {
  const status = err.status || (err.code === "LIMIT_FILE_SIZE" ? 400 : 500);
  if (status >= 500) console.error(err);

  // Production mein andar ki galti (DB error wagairah) user ko nahi dikhate
  const hide = status === 500 && process.env.NODE_ENV === "production";
  res.status(status).json({ message: hide ? "Server error. Please try again." : err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

connectDB()
  .then(() => {
    checkExecutionEnvironment();
    verifyEmailSetup();
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });