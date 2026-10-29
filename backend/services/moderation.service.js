import AuditLog from "../models/AuditLog.js";
import Job from "../models/Job.js";

// Kabhi throw nahi karta, par fail ho to log mein dikhta hai
export async function logAudit({ actor, target, action, details = {} }) {
  try {
    await AuditLog.create({ actor, target, action, details });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}

// Suspend/reject/block par fraud jobs candidates se turant hata do
export async function closeOpenJobs(recruiterId) {
  const result = await Job.updateMany({ recruiter: recruiterId, status: "open" }, { status: "closed" });
  return result.modifiedCount;
}