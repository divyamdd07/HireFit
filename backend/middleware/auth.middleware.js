import jwt from "jsonwebtoken";
import User from "../models/User.js";

// 1) AUTHENTICATION: har request pe user DB se padha jata hai,
//    isliye block/suspend/role change turant lagu hota hai (purana JWT bekaar)
export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (!token) return res.status(401).json({ message: "Please log in." });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User no longer exists." });
    if (user.isBlocked) return res.status(403).json({ message: "Your account has been blocked." });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
}

// 2) AUTHORIZATION (RBAC)
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "You don't have permission to do this." });
  }
  next();
};

// 3) RECRUITER VERIFICATION: role ke ALAWA email + admin approval bhi chahiye
export const isVerifiedRecruiter = (user) =>
  user.role === "recruiter" && user.emailVerified === true && user.verificationStatus === "verified";

const BLOCK_MESSAGES = {
  none: "Submit your company details to start the recruiter verification.",
  pending: "Your recruiter account is waiting for admin approval.",
  rejected: "Your recruiter verification was rejected. Check the reason and resubmit your details.",
  suspended: "Your recruiter account has been suspended.",
};

// authorize("recruiter") ke BAAD lagao
export function requireVerifiedRecruiter(req, res, next) {
  if (isVerifiedRecruiter(req.user)) return next();

  const status = req.user.verificationStatus || "none";
  const emailVerified = req.user.emailVerified === true;
  const message =
    status === "verified" && !emailVerified
      ? "Please verify your email address first."
      : BLOCK_MESSAGES[status] || "Your recruiter account is not verified.";

  res.status(403).json({ code: "RECRUITER_NOT_VERIFIED", verificationStatus: status, emailVerified, message });
}