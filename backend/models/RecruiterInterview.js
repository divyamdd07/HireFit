import mongoose from "mongoose";

const { Schema } = mongoose;

const rating = { type: Number, min: 1, max: 5 };

const recruiterInterviewSchema = new Schema(
  {
    recruiter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    candidate: { type: Schema.Types.ObjectId, ref: "User", required: true },
    application: { type: Schema.Types.ObjectId, ref: "Application", required: true },
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },

    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 45 },
    mode: { type: String, enum: ["online", "onsite"], default: "online" },
    meetingLink: { type: String, default: "" }, // online ho to link, onsite ho to address
    status: { type: String, enum: ["scheduled", "completed", "cancelled"], default: "scheduled" },

    // Recruiter ka private kaam (candidate ko kabhi nahi bhejna)
    notes: { type: String, default: "" },
    ratings: { technical: rating, communication: rating, problemSolving: rating, cultureFit: rating },
    feedback: { type: String, default: "" },
    recommendation: { type: String, enum: ["strong-yes", "yes", "no", "strong-no"] },

    // AI ki madad (sirf suggestions, DB mein isliye ki refresh pe dobara AI call na ho)
    suggestedQuestions: [{ question: String, skill: String, reason: String, _id: false }],
    aiSummary: { summary: String, strengths: [String], concerns: [String] },

    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("RecruiterInterview", recruiterInterviewSchema);