import mongoose from "mongoose";

export const STATUSES = [
  "applied",
  "screening",
  "assessment",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
];

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resumePath: { type: String }, // purani applications (disk wali), naye mein use nahi hota
    resumeFile: { type: Buffer, select: false }, // PDF yahin store hoti hai. select:false = list queries mein nahi aati
    resumeData: { type: Object }, // AI ka structured output

    atsScore: { type: Number, default: 0 },
    matchPercentage: { type: Number, default: 0 },
    matchingSkills: [String],
    missingSkills: [String],
    matchingPreferred: [String],
    missingPreferred: [String],
    breakdown: { type: Object },

    status: { type: String, enum: STATUSES, default: "applied" },
  },
  { timestamps: true }
);

// Ek candidate ek job pe ek hi baar apply kar sakta hai
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);