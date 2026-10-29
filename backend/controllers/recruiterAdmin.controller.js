import mongoose from "mongoose";
import User from "../models/User.js";
import Job from "../models/Job.js";
import AuditLog from "../models/AuditLog.js";
import { getSignals } from "../utils/recruiterVerification.js";
import { logAudit, closeOpenJobs } from "../services/moderation.service.js";
import { notify } from "../services/notification.service.js";
import { emailUser } from "../services/email.service.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const STATUSES = ["pending", "verified", "rejected", "suspended", "none"];
// Purane users mein field hota hi nahi, wo "none" gino
const statusFilter = (s) => (s === "none" ? { $in: ["none", null] } : s);

const LIST_FIELDS =
  "name email isBlocked emailVerified verificationStatus verificationReason verificationSubmittedAt verificationReviewedAt recruiterProfile createdAt";

export async function listRecruiters(req, res, next) {
  try {
    const status = STATUSES.includes(req.query.status) ? req.query.status : "pending";

    const [recruiters, ...countList] = await Promise.all([
      User.find({ role: "recruiter", verificationStatus: statusFilter(status) })
        .select(LIST_FIELDS)
        .sort({ verificationSubmittedAt: 1, createdAt: 1 }) // sabse purani request pehle
        .limit(100),
      ...STATUSES.map((s) => User.countDocuments({ role: "recruiter", verificationStatus: statusFilter(s) })),
    ]);

    const counts = Object.fromEntries(STATUSES.map((s, i) => [s, countList[i]]));
    res.json({
      recruiters: recruiters.map((r) => ({ ...r.toObject(), signals: getSignals(r) })),
      counts,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecruiter(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, "Recruiter not found.");
    const user = await User.findOne({ _id: req.params.id, role: "recruiter" }).select(LIST_FIELDS);
    if (!user) throw httpError(404, "Recruiter not found.");

    // Duplicate / suspicious: same domain ya same company naam
    const p = user.toObject().recruiterProfile || {};
    const or = [];
    if (p.companyDomain) or.push({ "recruiterProfile.companyDomain": p.companyDomain });
    if (p.companyName) {
      or.push({ "recruiterProfile.companyName": new RegExp(`^${escapeRegex(p.companyName)}$`, "i") });
    }
    const duplicates = or.length
      ? await User.find({ _id: { $ne: user._id }, role: "recruiter", $or: or })
          .select("name email verificationStatus recruiterProfile.companyName recruiterProfile.companyDomain")
          .limit(10)
      : [];

    const [jobCount, history] = await Promise.all([
      Job.countDocuments({ recruiter: user._id }),
      AuditLog.find({ target: user._id }).populate("actor", "name").sort({ createdAt: -1 }).limit(15),
    ]);

    res.json({ recruiter: { ...user.toObject(), signals: getSignals(user) }, duplicates, jobCount, history });
  } catch (err) {
    next(err);
  }
}

// Allowed transitions. Verify sirf yahin se hota hai, role change se kabhi nahi
const ACTIONS = {
  approve: { from: ["pending", "rejected"], to: "verified", needsEmail: true },
  reject: { from: ["pending"], to: "rejected", needsReason: true },
  suspend: { from: ["verified"], to: "suspended", needsReason: true },
  reinstate: { from: ["suspended"], to: "verified", needsEmail: true },
};

export async function decideRecruiter(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, "Recruiter not found.");
    const rule = ACTIONS[req.body.action];
    if (!rule) throw httpError(400, "Invalid action.");

    const user = await User.findOne({ _id: req.params.id, role: "recruiter" });
    if (!user) throw httpError(404, "Recruiter not found.");
    if (user._id.toString() === req.user._id.toString()) throw httpError(400, "You cannot review your own account.");

    const from = user.verificationStatus || "none";
    if (!rule.from.includes(from)) throw httpError(400, `You cannot ${req.body.action} a recruiter who is "${from}".`);
    if (rule.needsEmail && !user.emailVerified) {
      throw httpError(400, "This recruiter has not verified their email yet.");
    }

    const reason = String(req.body.reason || "").trim().slice(0, 500);
    if (rule.needsReason && reason.length < 5) throw httpError(400, "Please write a clear reason.");

    user.verificationStatus = rule.to;
    user.verificationReason = rule.needsReason ? reason : "";
    user.verificationReviewedAt = new Date();
    user.verificationReviewedBy = req.user._id;
    await user.save();

    let closedJobs = 0;
    if (["reject", "suspend"].includes(req.body.action)) closedJobs = await closeOpenJobs(user._id);

    logAudit({
      actor: req.user._id,
      target: user._id,
      action: `recruiter.${req.body.action}`,
      details: { from, to: rule.to, reason, closedJobs },
    });

    const messages = {
      approve: "Your recruiter account has been approved. You can now post jobs.",
      reject: `Your recruiter verification was rejected. Reason: ${reason}`,
      suspend: `Your recruiter account has been suspended. Reason: ${reason}`,
      reinstate: "Your recruiter account has been reinstated. Re-open your jobs if needed.",
    };
    notify(user._id, {
      type: "verification",
      title: "Recruiter verification update",
      message: messages[req.body.action],
      link: "/recruiter/verification",
    });
    emailUser(user._id, {
      subject: "Recruiter verification update",
      heading: "Your recruiter verification status changed",
      lines: [messages[req.body.action]],
      linkPath: "/recruiter/verification",
      linkText: "View status",
    });

    res.json({ status: user.verificationStatus, closedJobs });
  } catch (err) {
    next(err);
  }
}

export async function listAuditLogs(req, res, next) {
  try {
    const logs = await AuditLog.find()
      .populate("actor", "name email")
      .populate("target", "name email")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}