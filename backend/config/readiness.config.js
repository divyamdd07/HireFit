// Readiness score ke weights. Total 1.0 hona chahiye.
export const READINESS_WEIGHTS = {
  ats: 0.2,
  coding: 0.35,
  interview: 0.25,
  jobMatch: 0.2,
};

export const THRESHOLDS = {
  verified: 70, // demonstrated >= 70 => verified
  partial: 50, // 50-69 => partial, isse neeche => gap
  jobReady: 75, // readiness >= 75
  almostReady: 55, // readiness >= 55
};