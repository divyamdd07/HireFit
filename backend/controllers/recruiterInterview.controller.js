import RecruiterInterview from "../models/RecruiterInterview.js";
import Application from "../models/Application.js";
import Assessment from "../models/Assessment.js";
import Attempt from "../models/Attempt.js";
import Job from "../models/Job.js";
import MockInterview from "../models/MockInterview.js";
import { buildCandidateIntelligence } from "../services/intelligence.service.js";
import { suggestQuestions, summarizeNotes } from "../services/interviewAssist.service.js";
import { notify } from "../services/notification.service.js";
import { emailUser } from "../services/email.service.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

const RATING_KEYS = ["technical", "communication", "problemSolving", "cultureFit"];
const RECOMMENDATIONS = ["strong-yes", "yes", "no", "strong-no"];
const MAX_NOTES = 10000;

// Interview dhundo + check karo ki isi recruiter ka hai (ownership check)
async function loadOwned(id, userId) {
  const interview = await RecruiterInterview.findById(id)
    .populate("candidate", "name email")
    .populate("job", "title");
  if (!interview || interview.recruiter.toString() !== userId.toString()) {
    throw httpError(404, "Interview not found.");
  }
  return interview;
}

const assertScheduled = (interview) => {
  if (interview.status !== "scheduled") throw httpError(400, "This interview is already completed or cancelled.");
};

// Notes, ratings, feedback, recommendation ko validate karke interview mein rakho
function applyEvaluation(interview, body) {
  if (body.notes !== undefined) interview.notes = String(body.notes).slice(0, MAX_NOTES);
  if (body.feedback !== undefined) interview.feedback = String(body.feedback).slice(0, 3000);

  if (body.recommendation !== undefined) {
    if (body.recommendation === "" || body.recommendation === null) {
      interview.recommendation = undefined;
    } else if (RECOMMENDATIONS.includes(body.recommendation)) {
      interview.recommendation = body.recommendation;
    } else {
      throw httpError(400, "Invalid recommendation.");
    }
  }

  for (const key of RATING_KEYS) {
    const raw = body.ratings?.[key];
    if (raw === undefined || raw === null || raw === "") continue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > 5) throw httpError(400, "Ratings must be 1 to 5.");
    interview.ratings[key] = value;
  }
}

// Candidate ka poora profile: ATS + assessment + mock interview + skill verdicts
async function buildProfile(interview) {
  const candidateId = interview.candidate._id;

  const [application, intelligence, assessments, mock] = await Promise.all([
    Application.findById(interview.application),
    buildCandidateIntelligence(candidateId),
    Assessment.find({ job: interview.job._id }).select("title"),
    MockInterview.findOne({ candidate: candidateId, status: "completed" })
      .sort({ createdAt: -1 })
      .select("role level overallScore report createdAt"), // turns (answers) nahi bhejte
  ]);

  const attempts = await Attempt.find({
    candidate: candidateId,
    assessment: { $in: assessments.map((a) => a._id) },
    status: "submitted",
  }).select("assessment percentage totalScore maxScore skillScores");

  return {
    application: application && {
      _id: application._id,
      status: application.status,
      atsScore: application.atsScore,
      matchPercentage: application.matchPercentage,
      matchingSkills: application.matchingSkills,
      missingSkills: application.missingSkills,
      resumeData: application.resumeData,
    },
    assessments: attempts.map((at) => ({
      title: assessments.find((a) => a._id.toString() === at.assessment.toString())?.title,
      percentage: at.percentage,
      totalScore: at.totalScore,
      maxScore: at.maxScore,
      skillScores: at.skillScores,
    })),
    mockInterview: mock,
    intelligence: {
      readiness: intelligence.readiness,
      skills: intelligence.skills,
      interviewWeakAreas: intelligence.interviewWeakAreas,
    },
  };
}

// ---------- Schedule ----------
export async function scheduleInterview(req, res, next) {
  try {
    const application = await Application.findById(req.body.applicationId).populate("job");
    if (!application) throw httpError(404, "Application not found.");
    if (application.job.recruiter.toString() !== req.user._id.toString()) {
      throw httpError(403, "This is not your job.");
    }

    const scheduledAt = new Date(req.body.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
      throw httpError(400, "Choose a future date and time.");
    }

    const existing = await RecruiterInterview.findOne({ application: application._id, status: "scheduled" });
    if (existing) throw httpError(409, "An interview is already scheduled for this candidate.");

    const interview = await RecruiterInterview.create({
      recruiter: req.user._id,
      candidate: application.candidate,
      application: application._id,
      job: application.job._id,
      scheduledAt,
      durationMinutes: Math.min(Math.max(Number(req.body.durationMinutes) || 45, 15), 180),
      mode: pick(req.body.mode, ["online", "onsite"], "online"),
      meetingLink: String(req.body.meetingLink || "").trim().slice(0, 300),
    });
      notify(application.candidate, {
      type: "interview",
      title: "Interview scheduled",
      message: `${application.job.title}: ${scheduledAt.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      })} (${interview.mode}).`,
      link: "/my-interviews",
    });
      const whenText = scheduledAt.toLocaleString("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
       emailUser(application.candidate, {
      subject: `Interview scheduled: ${application.job.title}`,
      heading: "Your interview has been scheduled",
      lines: [
        `Position: ${application.job.title}`,
        `When: ${whenText} (IST), ${interview.durationMinutes} minutes`,
        `Mode: ${interview.mode}`,
        interview.meetingLink ? `Link / address: ${interview.meetingLink}` : "Details will be shared by the recruiter.",
      ],
      linkPath: "/my-interviews",
      linkText: "View interview details",
    });

    // Application lifecycle: Interview stage (agar decision ho chuka ho to na chhedo)
    if (!["selected", "rejected"].includes(application.status)) {
      application.status = "interview";
      await application.save();
    }

    res.status(201).json({ interview });
  } catch (err) {
    next(err);
  }
}

// ---------- Recruiter ki list ----------
export async function getMyInterviews(req, res, next) {
  try {
    const interviews = await RecruiterInterview.find({ recruiter: req.user._id })
      .populate("candidate", "name email")
      .populate("job", "title")
      .select("-notes -feedback -suggestedQuestions -aiSummary")
      .sort({ scheduledAt: 1 });
    res.json({ interviews });
  } catch (err) {
    next(err);
  }
}

// ---------- Interview room ----------
export async function getInterview(req, res, next) {
  try {
    const interview = await loadOwned(req.params.id, req.user._id);
    const profile = await buildProfile(interview);
    res.json({ interview, profile });
  } catch (err) {
    next(err);
  }
}

// ---------- Draft save (notes, ratings...) ----------
export async function saveDraft(req, res, next) {
  try {
    const interview = await loadOwned(req.params.id, req.user._id);
    assertScheduled(interview);
    applyEvaluation(interview, req.body);
    await interview.save();
    res.json({ interview });
  } catch (err) {
    next(err);
  }
}

// ---------- AI: sawal suggest ----------
export async function generateQuestions(req, res, next) {
  try {
    const interview = await loadOwned(req.params.id, req.user._id);
    assertScheduled(interview);

    const job = await Job.findById(interview.job._id);
    const profile = await buildProfile(interview);
    const skills = profile.intelligence.skills;
    const namesOf = (verdicts) => skills.filter((s) => verdicts.includes(s.verdict)).map((s) => s.name);

    const questions = await suggestQuestions({
      jobTitle: job.title,
      jobSkills: job.requiredSkills,
      candidate: {
        verifiedSkills: namesOf(["verified"]),
        weakSkills: namesOf(["gap", "partial"]),
        untestedSkills: namesOf(["unverified"]),
        missingJobSkills: profile.application?.missingSkills || [],
        mockWeakAreas: profile.intelligence.interviewWeakAreas,
      },
      count: Math.min(Math.max(Number(req.body.count) || 6, 3), 10),
    });
    if (questions.length === 0) throw httpError(502, "AI did not return questions. Try again.");

    interview.suggestedQuestions = questions;
    await interview.save();
    res.json({ interview });
  } catch (err) {
    next(err);
  }
}

// ---------- AI: notes summary ----------
export async function generateSummary(req, res, next) {
  try {
    const interview = await loadOwned(req.params.id, req.user._id);
    if (interview.notes.trim().length < 20) throw httpError(400, "Write some notes first (at least 20 characters).");

    interview.aiSummary = await summarizeNotes({
      notes: interview.notes,
      ratings: interview.ratings?.toObject?.() ?? interview.ratings,
    });
    await interview.save();
    res.json({ interview });
  } catch (err) {
    next(err);
  }
}

// ---------- Complete: recruiter ka final evaluation ----------
export async function completeInterview(req, res, next) {
  try {
    const interview = await loadOwned(req.params.id, req.user._id);
    assertScheduled(interview);
    applyEvaluation(interview, req.body);

    const missingRating = RATING_KEYS.some((key) => !interview.ratings?.[key]);
    if (missingRating) throw httpError(400, "Please give all 4 ratings.");
    if (interview.feedback.trim().length < 10) throw httpError(400, "Please write your feedback.");
    if (!interview.recommendation) throw httpError(400, "Please choose your recommendation.");

    interview.status = "completed";
    interview.completedAt = new Date();
    await interview.save();
    // NOTE: application status yahan nahi badalta. Final decision recruiter alag se leta hai.
    res.json({ interview });
  } catch (err) {
    next(err);
  }
}

export async function cancelInterview(req, res, next) {
  try {
    const interview = await loadOwned(req.params.id, req.user._id);
    assertScheduled(interview);
    interview.status = "cancelled";
    await interview.save();
      notify(interview.candidate._id, {
      type: "interview",
      title: "Interview cancelled",
      message: `Your interview for ${interview.job.title} was cancelled by the recruiter.`,
      link: "/my-interviews",
    });
        emailUser(interview.candidate._id, {
      subject: `Interview cancelled: ${interview.job.title}`,
      heading: "Your interview was cancelled",
      lines: [`The interview for ${interview.job.title} was cancelled by the recruiter. You will be contacted if it is rescheduled.`],
      linkPath: "/my-interviews",
      linkText: "View my interviews",
    });
    res.json({ interview });
  } catch (err) {
    next(err);
  }
}

// ---------- Candidate: sirf apna schedule (notes/ratings nahi) ----------
export async function getMySchedule(req, res, next) {
  try {
    const interviews = await RecruiterInterview.find({ candidate: req.user._id })
      .select("job recruiter scheduledAt durationMinutes mode meetingLink status")
      .populate("job", "title")
      .populate("recruiter", "name")
      .sort({ scheduledAt: -1 });
    res.json({ interviews });
  } catch (err) {
    next(err);
  }
}