import Assessment from "../models/Assessment.js";
import Attempt from "../models/Attempt.js";
import Application from "../models/Application.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

// Assessment dhundo + check karo ki isi recruiter ka hai
async function findOwnedAssessment(id, userId) {
  const assessment = await Assessment.findById(id).populate("job", "title");
  if (!assessment) throw httpError(404, "Assessment not found.");
  if (assessment.recruiter.toString() !== userId.toString()) {
    throw httpError(403, "This is not your assessment.");
  }
  return assessment;
}

const minutesBetween = (start, end) =>
  start && end ? Math.round(((end - start) / 60000) * 10) / 10 : null;

// ---------- Ek assessment ke saare results ----------
export async function getAssessmentResults(req, res, next) {
  try {
    const assessment = await findOwnedAssessment(req.params.id, req.user._id);

    const attempts = await Attempt.find({ assessment: assessment._id }).populate(
      "candidate",
      "name email"
    );

    // Un candidates ki application bhi lao (ATS score ke liye)
    const applications = await Application.find({
      job: assessment.job._id,
      candidate: { $in: attempts.map((a) => a.candidate._id) },
    }).select("candidate atsScore matchPercentage status");

    const rows = attempts.map((attempt) => {
      const application = applications.find(
        (app) => app.candidate.toString() === attempt.candidate._id.toString()
      );
      return {
        attemptId: attempt._id,
        candidate: attempt.candidate,
        status: attempt.status,
        percentage: attempt.percentage,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        minutesTaken: minutesBetween(attempt.startedAt, attempt.submittedAt),
        skillScores: attempt.skillScores,
        application: application
          ? {
              _id: application._id,
              atsScore: application.atsScore,
              matchPercentage: application.matchPercentage,
              status: application.status,
            }
          : null,
      };
    });

    // Submitted pehle, phir percentage ke hisaab se
    rows.sort((a, b) => {
      if (a.status !== b.status) return a.status === "submitted" ? -1 : 1;
      return b.percentage - a.percentage;
    });

    const submitted = rows.filter((r) => r.status === "submitted");
    const stats = {
      started: rows.length,
      submitted: submitted.length,
      averagePercentage: submitted.length
        ? Math.round(submitted.reduce((sum, r) => sum + r.percentage, 0) / submitted.length)
        : 0,
      highestPercentage: submitted.length ? Math.max(...submitted.map((r) => r.percentage)) : 0,
    };

    res.json({
      assessment: { _id: assessment._id, title: assessment.title, job: assessment.job },
      stats,
      rows,
    });
  } catch (err) {
    next(err);
  }
}

// ---------- Ek candidate ka question-wise detail ----------
export async function getAttemptDetail(req, res, next) {
  try {
    const assessment = await findOwnedAssessment(req.params.id, req.user._id);

    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      assessment: assessment._id, // dusre assessment ka attempt na khul jaye
    }).populate("candidate", "name email");
    if (!attempt) throw httpError(404, "Attempt not found.");

    const questions = assessment.questions.map((question) => {
      const answer = attempt.answers.find(
        (a) => a.questionId.toString() === question._id.toString()
      );

      const base = {
        _id: question._id,
        type: question.type,
        title: question.title,
        text: question.text,
        skill: question.skill,
        points: question.points,
        score: answer?.score ?? 0,
      };

      if (question.type === "mcq") {
        return {
          ...base,
          options: question.options,
          correctIndex: question.correctIndex,
          selectedIndex: answer?.selectedIndex ?? null,
        };
      }

      const submissions = answer?.submissions || [];
      const best = submissions.reduce((top, s) => (!top || s.passed > top.passed ? s : top), null);
      return {
        ...base,
        submissionCount: submissions.length,
        bestPassed: best?.passed ?? 0,
        bestTotal: best?.total ?? question.testCases.length,
        language: answer?.language || "",
        code: answer?.code || "",
      };
    });

    const application = await Application.findOne({
      job: assessment.job._id,
      candidate: attempt.candidate._id,
    }).select("atsScore matchPercentage status");

    res.json({
      candidate: attempt.candidate,
      attempt: {
        status: attempt.status,
        percentage: attempt.percentage,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        minutesTaken: minutesBetween(attempt.startedAt, attempt.submittedAt),
        skillScores: attempt.skillScores,
      },
      application,
      questions,
    });
  } catch (err) {
    next(err);
  }
}