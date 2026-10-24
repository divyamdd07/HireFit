import { askForJson } from "./aiClient.js";

const PRIORITIES = ["high", "medium", "low"];
const cleanText = (value, max = 300) => String(value || "").trim().slice(0, max);

export async function generateRoadmap({ targetRole, weakSkills, missingSkills, topics }) {
  const prompt = `You are a career coach creating a personalised learning roadmap.

Target role: ${targetRole || "Software Developer"}
Skills the candidate claims but performed weakly in tests/interviews: ${weakSkills.join(", ") || "none"}
Skills required by jobs but missing from the resume: ${missingSkills.join(", ") || "none"}
Topics recommended by mock interview reports: ${topics.join(", ") || "none"}

Return ONLY valid JSON:
{ "items": [
  { "title": "short action title", "skill": "main skill", "priority": "high | medium | low",
    "why": "1-2 sentences, why this matters for the role",
    "steps": ["3-4 concrete learning steps"], "estimatedWeeks": 2 }
] }

Rules:
- Maximum 6 items, ordered by priority (most important first).
- Use only the skills and topics given above. Do not invent unrelated skills.
- Steps must be practical (what to build, practise or read), not generic advice.`;

  const result = await askForJson(prompt, 5000);
  const list = Array.isArray(result) ? result : result?.items || [];

  return list
    .slice(0, 6)
    .map((item) => ({
      title: cleanText(item.title, 120),
      skill: cleanText(item.skill, 60),
      priority: PRIORITIES.includes(item.priority) ? item.priority : "medium",
      why: cleanText(item.why, 400),
      steps: (Array.isArray(item.steps) ? item.steps : []).map((s) => cleanText(s, 200)).filter(Boolean).slice(0, 4),
      estimatedWeeks: Math.min(12, Math.max(1, Number(item.estimatedWeeks) || 2)),
    }))
    .filter((item) => item.title);
}