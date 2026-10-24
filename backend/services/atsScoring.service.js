// Different names for the same skill are treated as equal
const ALIASES = {
  reactjs: "react",
  "react.js": "react",
  node: "node.js",
  nodejs: "node.js",
  js: "javascript",
  ts: "typescript",
  mongo: "mongodb",
  postgres: "postgresql",
  "express.js": "express",
  expressjs: "express",
};

export function normalize(skill) {
  const s = String(skill).toLowerCase().trim();
  return ALIASES[s] || s;
}

function matchSkills(candidateSkills, jobSkills) {
  const candidateSet = new Set(candidateSkills.map(normalize));
  const matched = [];
  const missing = [];

  for (const skill of jobSkills) {
    if (candidateSet.has(normalize(skill))) matched.push(skill);
    else missing.push(skill);
  }
  return { matched, missing };
}

export function calculateAtsScore(resumeData, job) {
  // 1. Required skills: 50 points
  const required = matchSkills(resumeData.skills || [], job.requiredSkills);
  const requiredScore = job.requiredSkills.length
    ? (required.matched.length / job.requiredSkills.length) * 50
    : 50;

  // 2. Preferred skills: 15 points
  const preferred = matchSkills(resumeData.skills || [], job.preferredSkills);
  const preferredScore = job.preferredSkills.length
    ? (preferred.matched.length / job.preferredSkills.length) * 15
    : 15;

  // 3. Experience: 20 points
  const candidateYears = resumeData.totalYearsExperience || 0;
  const experienceScore = job.minExperience > 0
    ? Math.min(candidateYears / job.minExperience, 1) * 20
    : 20;

  // 4. Completeness: 15 points (3 points per section)
  const checks = [
    Boolean(resumeData.email),
    Boolean(resumeData.phone),
    (resumeData.education || []).length > 0,
    (resumeData.projects || []).length > 0,
    (resumeData.skills || []).length >= 5,
  ];
  const completenessScore = checks.filter(Boolean).length * 3;

  const atsScore = Math.round(
    requiredScore + preferredScore + experienceScore + completenessScore
  );

  // Job match % is based only on skills (required weighted more)
  const totalJobSkills = job.requiredSkills.length + job.preferredSkills.length;
  const matchPercentage = totalJobSkills
    ? Math.round(
        ((required.matched.length + preferred.matched.length) / totalJobSkills) * 100
      )
    : 0;

  return {
    atsScore,
    matchPercentage,
    matchingSkills: required.matched,
    missingSkills: required.missing,
    matchingPreferred: preferred.matched,
    missingPreferred: preferred.missing,
    breakdown: {
      requiredSkills: { score: Math.round(requiredScore), max: 50 },
      preferredSkills: { score: Math.round(preferredScore), max: 15 },
      experience: { score: Math.round(experienceScore), max: 20 },
      completeness: { score: completenessScore, max: 15 },
    },
  };
}