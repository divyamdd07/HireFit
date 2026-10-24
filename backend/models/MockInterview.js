import mongoose from "mongoose";

const { Schema } = mongoose;

// Interview ka ek sawal-jawab
const turnSchema = new Schema({
  question: { type: String, required: true },
  topic: { type: String, default: "" },
  isFollowUp: { type: Boolean, default: false },

  answer: { type: String, default: "" },
  answeredAt: Date, // isi se pata chalta hai ki answer ho chuka hai ya nahi

  evaluation: {
    scores: {
      technicalAccuracy: Number,
      relevance: Number,
      completeness: Number,
      clarity: Number,
      conceptualUnderstanding: Number,
    },
    score: Number, // weighted, 0-10 (code calculate karta hai)
    feedback: String,
    idealPoints: [String], // achha answer mein kya hona chahiye tha
  },
});

const interviewSchema = new Schema(
  {
    candidate: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true, trim: true },
    level: { type: String, enum: ["fresher", "junior", "mid", "senior"], default: "fresher" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    type: { type: String, enum: ["technical", "hr", "mixed"], default: "technical" },
    totalQuestions: { type: Number, default: 5 },

    turns: [turnSchema],
    status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" },

    overallScore: { type: Number, default: 0 }, // 0-100
    report: {
      summary: String,
      strengths: [String],
      weakAreas: [String],
      recommendedTopics: [String],
      suggestions: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model("MockInterview", interviewSchema);