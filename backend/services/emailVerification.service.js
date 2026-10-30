import crypto from "crypto";
import { emailUser } from "./email.service.js";

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Token ka sirf hash DB mein jata hai. Asli token sirf email link mein hota hai
export async function issueEmailVerification(user) {
  const token = crypto.randomBytes(32).toString("hex");
  user.emailVerifyTokenHash = hashToken(token);
  user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.emailVerifySentAt = new Date();
  await user.save();

  const linkPath = `/verify-email?token=${token}`;
  if (process.env.NODE_ENV !== "production") {
    console.log("Email verification link (dev only):", (process.env.CLIENT_URL || "http://localhost:5173") + linkPath);
  }

  emailUser(user._id, {
    subject: "Verify your HireFit recruiter email",
    heading: "Verify your email address",
    lines: [
      "Please confirm that this is your work email. The link is valid for 24 hours.",
      "After this, an admin will review your company details before you can post jobs.",
    ],
    linkPath,
    linkText: "Verify email",
  });
}