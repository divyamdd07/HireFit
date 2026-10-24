import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    minExperience: { type: Number, default: 0 },
    education: { type: String, default: "" },
    location: { type: String, default: "" },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract"],
      default: "full-time",
    },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);