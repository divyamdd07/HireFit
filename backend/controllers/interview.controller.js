import MockInterview from "../models/MockInterview.js";
import {
  generateFirstQuestion,
  evaluateAnswer,
  generateReport,
  calculateOverallScore,
} from "../services/interview.service.js";

const MAX_ANSWER_LENGTH = 3000;
const httpError = (status, message) => Object.assign(new Error(message), { status });
const pick = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);

async function findOwned(id, userId) {
  const interview = await MockInterview.findById(id);
  if (!interview || interview.candidate.toString() !== userId.toString()) {
    throw httpError(404, "Interview not found.");
  }
  return interview;
}

const allAnswered = (interview) =>
  interview.turns.length === interview.totalQuestions && interview.turns.every((t) => t.answeredAt);

// Report banao, overall score nikalo, interview complete karo
async function finishInterview(interview) {
  interview.report = await generateReport(interview);
  interview.overallScore = calculateOverallScore(interview.turns);
  interview.status = "completed";
  await interview.save();
}

export async function startInterview(req, res, next) {
  try {
    const role = String(req.body.role || "").trim().slice(0, 100);
    if (!role) return res.status(400).json({ message: "Please enter a role." });

    const setup = {
      role,
      level: pick(req.body.level, ["fresher", "junior", "mid", "senior"], "fresher"),
      difficulty: pick(req.body.difficulty, ["easy", "medium", "hard"], "medium"),
      type: pick(req.body.type, ["technical", "hr", "mixed"], "technical"),
      totalQuestions: Math.min(Math.max(Number(req.body.totalQuestions) || 5, 3), 10),
    };

    // Pehle AI se sawal lo. Fail hua to koi khaali interview DB mein nahi banega
    const first = await generateFirstQuestion(setup);

    const interview = await MockInterview.create({
      ...setup,
      candidate: req.user._id,
      turns: [{ question: first.question, topic: first.topic }],
    });
    res.status(201).json({ interview });
  } catch (err) {
    next(err);
  }
}

export async function getMyInterviews(req, res, next) {
  try {
    const interviews = await MockInterview.find({ candidate: req.user._id })
      .select("role level difficulty type totalQuestions status overallScore turns createdAt")
      .sort({ createdAt: -1 });

    // List ke liye poore turns nahi chahiye, sirf kitne answer hue
    const list = interviews.map((i) => ({
      _id: i._id,
      role: i.role,
      level: i.level,
      difficulty: i.difficulty,
      type: i.type,
      totalQuestions: i.totalQuestions,
      status: i.status,
      overallScore: i.overallScore,
      answeredCount: i.turns.filter((t) => t.answeredAt).length,
      createdAt: i.createdAt,
    }));
    res.json({ interviews: list });
  } catch (err) {
    next(err);
  }
}

export async function getInterview(req, res, next) {
  try {
    const interview = await findOwned(req.params.id, req.user._id);
    res.json({ interview });
  } catch (err) {
    next(err);
  }
}

export async function submitAnswer(req, res, next) {
  try {
    const interview = await findOwned(req.params.id, req.user._id);
    if (interview.status !== "in-progress") throw httpError(400, "This interview is already completed.");

    const turn = interview.turns[interview.turns.length - 1];
    if (!turn || turn.answeredAt) throw httpError(400, "There is no question waiting for an answer.");

    const answer = String(req.body.answer || "").trim();
    if (answer.length < 5) throw httpError(400, "Please write a proper answer.");
    if (answer.length > MAX_ANSWER_LENGTH) throw httpError(400, `Answer is too long (max ${MAX_ANSWER_LENGTH} characters).`);

    const isLast = interview.turns.length >= interview.totalQuestions;

    // Pehle AI. Agar yahan error aaya to kuch save nahi hoga, candidate dobara bhej sakta hai
    const { evaluation, next: nextQuestion } = await evaluateAnswer(interview, turn, answer, isLast);

    turn.answer = answer;
    turn.answeredAt = new Date();
    turn.evaluation = evaluation;
    if (nextQuestion) interview.turns.push(nextQuestion);
    await interview.save();

    // Last answer ke baad report. Fail ho jaye to answer safe hai, report dobara try ho sakti hai
    if (isLast) {
      try {
        await finishInterview(interview);
      } catch (err) {
        console.error("Report generation failed:", err.message);
      }
    }

    res.json({ interview });
  } catch (err) {
    next(err);
  }
}

// Report fail hui thi to yahan se dobara try karo
export async function retryReport(req, res, next) {
  try {
    const interview = await findOwned(req.params.id, req.user._id);
    if (interview.status === "completed") return res.json({ interview });
    if (!allAnswered(interview)) throw httpError(400, "Answer all questions first.");

    await finishInterview(interview);
    res.json({ interview });
  } catch (err) {
    next(err);
  }
}