import Application from "../models/Application.js";
import Attempt from "../models/Attempt.js";
import MockInterview from "../models/MockInterview.js";
import { normalize } from "./atsScoring.service.js";
import { READINESS_WEIGHTS, THRESHOLDS } from "../config/readiness.config.js";

const average = (numbers) =>
  numbers.length ? Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length) : null;
const percent = (score, max) => (max ? Math.round((score / max) * 100) : 0);
const unique = (list) => [...new Set(list)];
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "React hooks" topic mein "react" ek poora shabd hai? ("java" ko "javascript" se match nahi karna)
function topicMentionsSkill(topic, skillKey) {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(skillKey)}($|[^a-z0-9])`);
  return pattern.test(String(topic).toLowerCase());
}

function verdictFor(demonstrated) {
  if (demonstrated === null) return "unverified"; // resume mein hai par koi proof nahi
  if (demonstrated >= THRESHOLDS.verified) return "verified";
  if (demonstrated >= THRESHOLDS.partial) return "partial";
  return "gap"; // claim kiya par test/interview mein weak
}

// ---------- Readiness score: transparent formula ----------
export function calculateReadiness(components) {
  const available = Object.keys(READINESS_WEIGHTS).filter((key) => components[key] !== null);
  const missing = Object.keys(READINESS_WEIGHTS).filter((key) => components[key] === null);

  if (available.length === 0) return { score: null, label: "No data yet", breakdown: [], missing };

  // Jo data nahi hai uska weight baaki mein baant do
  const totalWeight = available.reduce((sum, key) => sum + READINESS_WEIGHTS[key], 0);
  let score = 0;
  const breakdown = available.map((key) => {
    const weight = READINESS_WEIGHTS[key] / totalWeight;
    const contribution = components[key] * weight;
    score += contribution;
    return {
      key,
      value: components[key],
      weightPercent: Math.round(weight * 100),
      contribution: Math.round(contribution * 10) / 10,
    };
  });

  const rounded = Math.round(score);
  const label =
    rounded >= THRESHOLDS.jobReady ? "Job ready"
    : rounded >= THRESHOLDS.almostReady ? "Almost ready"
    : "Needs improvement";

  return { score: rounded, label, breakdown, missing };
}

// ---------- Main: ek candidate ka poora analysis ----------
export async function buildCandidateIntelligence(candidateId) {
  const [applications, attempts, interviews] = await Promise.all([
    Application.find({ candidate: candidateId }).populate("job", "title").sort({ createdAt: -1 }),
    Attempt.find({ candidate: candidateId, status: "submitted" }),
    MockInterview.find({ candidate: candidateId, status: "completed" }).sort({ createdAt: -1 }),
  ]);

  // 1) CLAIMED: resume ke skills (sab applications ka union)
  const claimed = new Map(); // normalized -> display name
  for (const app of applications) {
    for (const skill of app.resumeData?.skills || []) {
      const key = normalize(skill);
      if (key && !claimed.has(key)) claimed.set(key, String(skill));
    }
  }

  // 2) DEMONSTRATED (assessment): skill-wise score jodo
  const assessmentSkills = new Map(); // normalized -> { name, score, max }
  for (const attempt of attempts) {
    for (const s of attempt.skillScores) {
      const key = normalize(s.skill);
      if (!key || key === "general") continue;
      const entry = assessmentSkills.get(key) || { name: s.skill, score: 0, max: 0 };
      entry.score += s.score;
      entry.max += s.max;
      assessmentSkills.set(key, entry);
    }
  }

  // 3) DEMONSTRATED (interview): har answered turn = (topic, score out of 10)
  const interviewTurns = interviews.flatMap((interview) =>
    interview.turns
      .filter((t) => t.answeredAt && t.topic)
      .map((t) => ({ topic: t.topic, score: (t.evaluation?.score || 0) * 10 }))
  );

  // Har claimed skill ka verdict
  const skills = [...claimed.entries()].map(([key, name]) => {
    const fromAssessment = assessmentSkills.get(key);
    const assessmentPercent = fromAssessment ? percent(fromAssessment.score, fromAssessment.max) : null;

    const matchingTurns = interviewTurns.filter((t) => topicMentionsSkill(t.topic, key));
    const interviewPercent = matchingTurns.length ? average(matchingTurns.map((t) => t.score)) : null;

    const evidence = [assessmentPercent, interviewPercent].filter((v) => v !== null);
    const demonstrated = average(evidence);

    return { name, assessmentPercent, interviewPercent, demonstrated, verdict: verdictFor(demonstrated) };
  });

  // Order: pehle gap, phir partial, unverified, verified
  const order = { gap: 0, partial: 1, unverified: 2, verified: 3 };
  skills.sort((a, b) => order[a.verdict] - order[b.verdict]);

  // Resume mein nahi likha par assessment mein achha kiya = hidden strength
  const extraSkills = [...assessmentSkills.entries()]
    .filter(([key, v]) => !claimed.has(key) && percent(v.score, v.max) >= THRESHOLDS.verified)
    .map(([, v]) => ({ name: v.name, assessmentPercent: percent(v.score, v.max) }));

  // 4) Readiness ke 4 components (data na ho to null)
  const components = {
    ats: average(applications.map((a) => a.atsScore)),
    jobMatch: average(applications.map((a) => a.matchPercentage)),
    coding: average(attempts.map((a) => a.percentage)),
    interview: average(interviews.map((i) => i.overallScore)),
  };

  const weakSkills = skills.filter((s) => ["gap", "partial"].includes(s.verdict)).map((s) => s.name);

  return {
    targetRole: applications[0]?.job?.title || "",
    components,
    readiness: calculateReadiness(components),
    skills,
    extraSkills,
    weakSkills,
    missingJobSkills: unique(applications.flatMap((a) => a.missingSkills)).slice(0, 10),
    interviewWeakAreas: unique(interviews.flatMap((i) => i.report?.weakAreas || [])).slice(0, 6),
    recommendedTopics: unique(interviews.flatMap((i) => i.report?.recommendedTopics || [])).slice(0, 8),
    progress: {
      resume: applications.length > 0,
      assessment: attempts.length > 0,
      interview: interviews.length > 0,
    },
    applications: applications.slice(0, 5).map((a) => ({
      _id: a._id,
      jobTitle: a.job?.title,
      status: a.status,
      atsScore: a.atsScore,
      matchPercentage: a.matchPercentage,
    })),
  };
}