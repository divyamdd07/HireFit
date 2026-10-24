import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: "" },
    expectedOutput: { type: String, default: "" },
    isHidden: { type: Boolean, default: false }, // false = sample (Run), true = hidden (Submit)
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema({
  type: { type: String, enum: ["mcq", "coding"], required: true },
  title: { type: String, default: "" }, // coding problem ka title
  text: { type: String, required: true }, // question / problem statement
  skill: { type: String, default: "" }, // baad mein skill-wise analysis ke liye
  points: { type: Number, default: 10, min: 1 },
  source: { type: String, enum: ["manual", "ai"], default: "manual" },

  // MCQ
  options: { type: [String], default: undefined },
  correctIndex: Number,

  // Coding
  constraints: { type: String, default: "" },
  testCases: { type: [testCaseSchema], default: undefined },
});

const assessmentSchema = new mongoose.Schema(
  {
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    title: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, default: 60, min: 5 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    skills: { type: [String], default: [] },
    questions: [questionSchema],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

export default mongoose.model("Assessment", assessmentSchema);