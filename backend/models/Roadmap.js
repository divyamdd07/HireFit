import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    title: String,
    skill: String,
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    why: String,
    steps: [String],
    estimatedWeeks: Number,
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [itemSchema],
  generatedAt: Date,
});

export default mongoose.model("Roadmap", roadmapSchema);