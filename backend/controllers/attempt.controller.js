import Assessment from "../models/Assessment.js";
import Application from "../models/Application.js";
import Attempt from "../models/Attempt.js";
import { runTestCases, isSupportedLanguage, executionMode } from "../services/execution/index.js";
import { sanitizeAssessment, getOrCreateAnswer, finalizeAttempt } from "../services/attempt.service.js";

const GRACE_MS = 5000; // network delay ke liye thoda extra time
const MAX_CODE_LENGTH = 20000;

const httpError = (status, message) => Object.assign(new Error(message), { status });

// Attempt dhundo + check karo ki candidate ka apna hai.
// Agar time nikal chuka hai to yahin auto-finish kar do.
async function loadAttempt(attemptId, userId) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt || attempt.candidate.toString() !== userId.toString()) {
    throw httpError(404, "Attempt not found.");
  }
  const assessment = await Assessment.findById(attempt.assessment);

  const timeIsOver = Date.now() > attempt.expiresAt.getTime() + GRACE_MS;
  if (attempt.status === "in-progress" && timeIsOver) {
    finalizeAttempt(attempt, assessment);
    await attempt.save();
  }
  return { attempt, assessment };
}

const assertActive = (attempt) => {
  if (attempt.status !== "in-progress") {
    throw httpError(400, "This attempt is already submitted or time is over.");
  }
};

// Run aur Submit dono ke common checks
async function prepareCodingRequest(req) {
    if (executionMode() === "disabled") {
    throw httpError(503, "Code execution is not available on this server. You can still answer the MCQs.");
  }
  const { attempt, assessment } = await loadAttempt(req.params.id, req.user._id);
  assertActive(attempt);

  const question = assessment.questions.id(req.params.qid);
  if (!question || question.type !== "coding") throw httpError(404, "Coding question not found.");

  const { code, language } = req.body;
  if (typeof code !== "string" || !code.trim()) throw httpError(400, "Please write some code first.");
  if (code.length > MAX_CODE_LENGTH) throw httpError(400, "Code is too long.");
  if (!isSupportedLanguage(language)) throw httpError(400, "This language is not supported.");

  return { attempt, question, code, language };
}

// ---------- Candidate ke liye available assessments ----------
export async function getAvailable(req, res, next) {
  try {
    const applications = await Application.find({ candidate: req.user._id }).select("job");
    const jobIds = applications.map((a) => a.job);

    const assessments = await Assessment.find({ job: { $in: jobIds }, status: "published" })
      .populate("job", "title")
      .sort({ createdAt: -1 });

    const attempts = await Attempt.find({
      candidate: req.user._id,
      assessment: { $in: assessments.map((a) => a._id) },
    }).select("assessment status percentage");

    const list = assessments.map((a) => {
      const attempt = attempts.find((t) => t.assessment.toString() === a._id.toString());
      return {
        _id: a._id,
        title: a.title,
        job: a.job,
        durationMinutes: a.durationMinutes,
        difficulty: a.difficulty,
        questionCount: a.questions.length,
        attempt: attempt
          ? { _id: attempt._id, status: attempt.status, percentage: attempt.percentage }
          : null,
      };
    });

    res.json({ assessments: list });
  } catch (err) {
    next(err);
  }
}

// ---------- Start (ya pehle se shuru hua ho to wahi wapas) ----------
export async function startAttempt(req, res, next) {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId);
    if (!assessment || assessment.status !== "published") {
      return res.status(404).json({ message: "Assessment not available." });
    }

    const application = await Application.findOne({ job: assessment.job, candidate: req.user._id });
    if (!application) {
      return res.status(403).json({ message: "Apply to this job first." });
    }

    let attempt = await Attempt.findOne({ assessment: assessment._id, candidate: req.user._id });
    if (!attempt) {
      const startedAt = new Date();
      attempt = await Attempt.create({
        assessment: assessment._id,
        candidate: req.user._id,
        startedAt,
        expiresAt: new Date(startedAt.getTime() + assessment.durationMinutes * 60 * 1000),
      });

      // Application lifecycle aage badhao
      if (["applied", "screening"].includes(application.status)) {
        application.status = "assessment";
        await application.save();
      }
    }

    res.json({ attemptId: attempt._id });
  } catch (err) {
    next(err);
  }
}

// ---------- Attempt padhna (page load / refresh pe) ----------
export async function getAttempt(req, res, next) {
  try {
    const { attempt, assessment } = await loadAttempt(req.params.id, req.user._id);
    const remainingSeconds =
      attempt.status === "in-progress"
        ? Math.max(0, Math.round((attempt.expiresAt.getTime() - Date.now()) / 1000))
        : 0;

    res.json({ attempt, assessment: sanitizeAssessment(assessment), remainingSeconds });
  } catch (err) {
    next(err);
  }
}

// ---------- MCQ answer save ----------
export async function saveMcqAnswer(req, res, next) {
  try {
    const { attempt, assessment } = await loadAttempt(req.params.id, req.user._id);
    assertActive(attempt);

    const question = assessment.questions.id(req.params.qid);
    if (!question || question.type !== "mcq") throw httpError(404, "MCQ not found.");

    const index = Number(req.body.selectedIndex);
    if (!Number.isInteger(index) || index < 0 || index >= question.options.length) {
      throw httpError(400, "Invalid option.");
    }

    getOrCreateAnswer(attempt, question._id).selectedIndex = index;
    await attempt.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ---------- RUN: sirf sample test cases, score save nahi hota ----------
export async function runSample(req, res, next) {
  try {
    const { attempt, question, code, language } = await prepareCodingRequest(req);

    const sampleCases = question.testCases.filter((t) => !t.isHidden);
    const results = await runTestCases(language, code, sampleCases);

    // Sirf code draft save karte hain, taaki refresh pe code na ud jaye
    const answer = getOrCreateAnswer(attempt, question._id);
    answer.code = code;
    answer.language = language;
    await attempt.save();

    res.json({ results });
  } catch (err) {
    next(err);
  }
}

// ---------- SUBMIT: saare test cases (hidden bhi), score save ----------
export async function submitSolution(req, res, next) {
  try {
    const { attempt, question, code, language } = await prepareCodingRequest(req);

    const results = await runTestCases(language, code, question.testCases);
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const score = Math.round((passed / total) * question.points * 100) / 100;

    const answer = getOrCreateAnswer(attempt, question._id);
    answer.code = code;
    answer.language = language;
    answer.submissions.push({ code, language, passed, total });
    answer.score = Math.max(answer.score, score); // best submission count hoga
    await attempt.save();

    // Candidate ko sirf counts. Hidden test ka input/output kabhi nahi
    const firstError = results.find((r) => r.error)?.error.slice(0, 500) || "";
    res.json({ result: { passed, total, score, error: firstError }, answer });
  } catch (err) {
    next(err);
  }
}

// ---------- Finish ----------
export async function finishAttempt(req, res, next) {
  try {
    const { attempt, assessment } = await loadAttempt(req.params.id, req.user._id);
    if (attempt.status === "in-progress") {
      finalizeAttempt(attempt, assessment);
      await attempt.save();
    }
    res.json({ attempt });
  } catch (err) {
    next(err);
  }
}