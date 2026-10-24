import { extractTextFromPdf } from "../services/resumeParser.service.js";
import { analyzeResumeWithAI } from "../services/ai.service.js";
import { calculateAtsScore } from "../services/atsScoring.service.js";

// "React, Node.js" -> ["React", "Node.js"]
const toList = (text) =>
  (text || "").split(",").map((s) => s.trim()).filter(Boolean);

export async function analyzeResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a PDF resume." });
    }
    if (!req.body.title || !req.body.description) {
      return res.status(400).json({ message: "Job title and description are required." });
    }

    const job = {
      title: req.body.title,
      description: req.body.description,
      requiredSkills: toList(req.body.requiredSkills),
      preferredSkills: toList(req.body.preferredSkills),
      minExperience: Number(req.body.minExperience) || 0,
    };

    const resumeText = await extractTextFromPdf(req.file.buffer);
    const resumeData = await analyzeResumeWithAI(resumeText, job);
    const score = calculateAtsScore(resumeData, job);

    res.json({ resumeData, ...score });
  } catch (err) {
    next(err); // goes to the central error handler in server.js
  }
}