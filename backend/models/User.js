import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false }, // select:false = hidden by default
    role: { type: String, enum: ["candidate", "recruiter", "admin"], default: "candidate" },
    isBlocked: { type: Boolean, default: false },
        // ---- Recruiter verification ----
    emailVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    emailVerifySentAt: { type: Date, select: false },

    // none = recruiter ne abhi details nahi bheji (ya candidate/admin)
    verificationStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected", "suspended"],
      default: "none",
    },
    verificationReason: { type: String, default: "" }, // reject/suspend ka karan
    verificationSubmittedAt: Date,
    verificationReviewedAt: Date,
    verificationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    recruiterProfile: {
      companyName: String,
      companyWebsite: String,
      companyDomain: String,
      designation: String,
      linkedinUrl: String,
      note: String,
      domainToken: String, // DNS TXT ke liye (ye DNS mein public hota hai, secret nahi)
      domainVerified: Boolean,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);