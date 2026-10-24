import Roadmap from "../models/Roadmap.js";
import { buildCandidateIntelligence } from "../services/intelligence.service.js";
import { generateRoadmap } from "../services/roadmap.service.js";

export async function getMyIntelligence(req, res, next) {
  try {
    const intelligence = await buildCandidateIntelligence(req.user._id);
    const roadmap = await Roadmap.findOne({ candidate: req.user._id });
    res.json({ intelligence, roadmap });
  } catch (err) {
    next(err);
  }
}

export async function createRoadmap(req, res, next) {
  try {
    const data = await buildCandidateIntelligence(req.user._id);

    const input = {
      targetRole: data.targetRole,
      weakSkills: data.weakSkills,
      missingSkills: data.missingJobSkills,
      topics: data.recommendedTopics,
    };
    if (!input.weakSkills.length && !input.missingSkills.length && !input.topics.length) {
      return res.status(400).json({
        message: "Not enough data yet. Apply to a job, take an assessment or a mock interview first.",
      });
    }

    const items = await generateRoadmap(input);
    if (items.length === 0) {
      return res.status(502).json({ message: "AI could not create a roadmap. Try again." });
    }

    const roadmap = await Roadmap.findOneAndUpdate(
      { candidate: req.user._id },
      { items, generatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ roadmap });
  } catch (err) {
    next(err);
  }
}