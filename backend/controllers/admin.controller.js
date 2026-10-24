import User from "../models/User.js";
import Job from "../models/Job.js";
import Application from "../models/Application.js";
import Assessment from "../models/Assessment.js";
import Attempt from "../models/Attempt.js";
import MockInterview from "../models/MockInterview.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- Platform stats ----------
export async function getAdminStats(req, res, next) {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      candidates, recruiters, admins, blocked, newUsers,
      jobs, openJobs, applications, assessments, attempts, interviews, recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "candidate" }),
      User.countDocuments({ role: "recruiter" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isBlocked: true }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      Job.countDocuments(),
      Job.countDocuments({ status: "open" }),
      Application.countDocuments(),
      Assessment.countDocuments(),
      Attempt.countDocuments({ status: "submitted" }),
      MockInterview.countDocuments({ status: "completed" }),
      User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt"),
    ]);

    res.json({
      users: { candidates, recruiters, admins, blocked, newThisWeek: newUsers },
      jobs: { total: jobs, open: openJobs },
      applications,
      assessments: { total: assessments, attemptsSubmitted: attempts },
      mockInterviewsCompleted: interviews,
      recentUsers,
    });
  } catch (err) {
    next(err);
  }
}

// ---------- Users list (search + role filter) ----------
export async function listUsers(req, res, next) {
  try {
    const filter = {};
    if (["candidate", "recruiter", "admin"].includes(req.query.role)) filter.role = req.query.role;

    const search = String(req.query.search || "").trim().slice(0, 60);
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

// ---------- Block/unblock ya role change ----------
export async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw httpError(404, "User not found.");

    // Guardrails
    if (user._id.toString() === req.user._id.toString()) throw httpError(400, "You cannot change your own account.");
    if (user.role === "admin") throw httpError(403, "Admin accounts cannot be changed here.");

    if (typeof req.body.isBlocked === "boolean") user.isBlocked = req.body.isBlocked;

    if (req.body.role !== undefined) {
      if (!["candidate", "recruiter"].includes(req.body.role)) throw httpError(400, "Invalid role.");
      user.role = req.body.role;
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// ---------- Job moderation ----------
export async function listAllJobs(req, res, next) {
  try {
    const jobs = await Job.find()
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
}

export async function toggleJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).populate("recruiter", "name email");
    if (!job) throw httpError(404, "Job not found.");
    job.status = job.status === "open" ? "closed" : "open";
    await job.save();
    res.json({ job });
  } catch (err) {
    next(err);
  }
}