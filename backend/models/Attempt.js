import mongoose from "mongoose";

const { Schema } = mongoose;

// Coding question ki har Submit ka record (history ke liye)
const submissionSchema = new Schema(
  {
    code: String,
    language: String,
    passed: Number,
    total: Number,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Ek question ka candidate ka jawab
const answerSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, required: true },
    selectedIndex: Number, // MCQ
    code: { type: String, default: "" }, // coding draft / last run
    language: { type: String, default: "" },
    submissions: { type: [submissionSchema], default: [] },
    score: { type: Number, default: 0 },
  },
  { _id: false }
);

const attemptSchema = new Schema(
  {
    assessment: { type: Schema.Types.ObjectId, ref: "Assessment", required: true },
    candidate: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ["in-progress", "submitted"], default: "in-progress" },
    answers: { type: [answerSchema], default: [] },

    // Finish hone par calculate hota hai
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    skillScores: [{ skill: String, score: Number, max: Number, _id: false }],
    submittedAt: Date,
  },
  { timestamps: true }
);

// Ek candidate ek assessment ka ek hi attempt de sakta hai
attemptSchema.index({ assessment: 1, candidate: 1 }, { unique: true });

export default mongoose.model("Attempt", attemptSchema);