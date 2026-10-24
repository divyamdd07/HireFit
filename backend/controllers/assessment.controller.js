import Assessment from "../models/Assessment.js";
import Job from "../models/Job.js";
import { cleanQuestion } from "../services/question.service.js";
import { generateQuestions } from "../services/questionGenerator.service.js";
import Application from "../models/Application.js";
import { notifyMany } from "../services/notification.service.js";
import { emailUsers } from "../services/email.service.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

const toList = (value) => {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  return (value || "").split(",").map((s) => s.trim()).filter(Boolean);
};

// Assessment dhundo + check karo ki yeh isi recruiter ka hai (ownership check)
async function findOwned(id, userId) {
  const assessment = await Assessment.findById(id).populate("job", "title");
  if (!assessment) throw httpError(404, "Assessment not found.");
  if (assessment.recruiter.toString() !== userId.toString()) {
    throw httpError(403, "This is not your assessment.");
  }
  return assessment;
}

const assertDraft = (assessment) => {
  if (assessment.status !== "draft") {
    throw httpError(400, "Unpublish the assessment before editing questions.");
  }
};

export async function createAssessment(req, res, next) {
  try {
    const { jobId, title } = req.body;
    if (!jobId || !title) return res.status(400).json({ message: "Job and title are required." });

    const job = await Job.findById(jobId);
    if (!job || job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Choose one of your own jobs." });
    }

    const assessment = await Assessment.create({
      recruiter: req.user._id,
      job: job._id,
      title,
      durationMinutes: Number(req.body.durationMinutes) || 60,
      difficulty: req.body.difficulty,
      skills: toList(req.body.skills),
    });
    res.status(201).json({ assessment });
  } catch (err) {
    next(err);
  }
}

export async function getMyAssessments(req, res, next) {
  try {
    const assessments = await Assessment.find({ recruiter: req.user._id })
      .populate("job", "title")
      .sort({ createdAt: -1 });
    res.json({ assessments });
  } catch (err) {
    next(err);
  }
}

export async function getAssessment(req, res, next) {
  try {
    const assessment = await findOwned(req.params.id, req.user._id);
    res.json({ assessment });
  } catch (err) {
    next(err);
  }
}

export async function setStatus(req, res, next) {
  try {
    const assessment = await findOwned(req.params.id, req.user._id);
    const { status } = req.body;
    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }
    if (status === "published" && assessment.questions.length === 0) {
      return res.status(400).json({ message: "Add at least one question before publishing." });
    }
        const justPublished = status === "published" && assessment.status === "draft";
    assessment.status = status;
    await assessment.save();

    // Is job ke active applicants ko batao ki assessment aa gaya
    if (justPublished) {
      const applications = await Application.find({
        job: assessment.job._id,
        status: { $nin: ["rejected", "selected"] },
      }).select("candidate");

      notifyMany(
        applications.map((a) => a.candidate),
        {
          type: "assessment",
          title: "New assessment available",
          message: `"${assessment.title}" is ready for ${assessment.job.title}. Duration: ${assessment.durationMinutes} min.`,
          link: "/tests",
        }
      );
       emailUsers(
        applications.map((a) => a.candidate),
        {
          subject: `New assessment: ${assessment.title}`,
          heading: "You have been invited to an assessment",
          lines: [
            `"${assessment.title}" is available for the ${assessment.job.title} position.`,
            `Duration: ${assessment.durationMinutes} minutes. The timer starts as soon as you click Start and cannot be paused.`,
          ],
          linkPath: "/tests",
          linkText: "Go to assessments",
        }
      );
    }
    res.json({ assessment });
  } catch (err) {
    next(err);
  }
}

// AI suggestions banata hai. DB mein SAVE NAHI karta.
export async function generateSuggestions(req, res, next) {
  try {
    const assessment = await findOwned(req.params.id, req.user._id);
    assertDraft(assessment);

    const mcqCount = Math.min(Math.max(Number(req.body.mcqCount) || 0, 0), 10);
    const codingCount = Math.min(Math.max(Number(req.body.codingCount) || 0, 0), 5);
    if (mcqCount + codingCount === 0) {
      return res.status(400).json({ message: "Choose at least one question to generate." });
    }

    const suggestions = await generateQuestions({
      jobTitle: assessment.job.title,
      skills: assessment.skills,
      difficulty: assessment.difficulty,
      durationMinutes: assessment.durationMinutes,
      mcqCount,
      codingCount,
    });
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
}

export async function addQuestion(req, res, next) {
  try {
    const assessment = await findOwned(req.params.id, req.user._id);
    assertDraft(assessment);

    const source = req.body.source === "ai" ? "ai" : "manual";
    assessment.questions.push(cleanQuestion(req.body, source));
    await assessment.save();
    res.status(201).json({ assessment });
  } catch (err) {
    next(err);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const assessment = await findOwned(req.params.id, req.user._id);
    assertDraft(assessment);

    const question = assessment.questions.id(req.params.qid);
    if (!question) return res.status(404).json({ message: "Question not found." });

    // Type badalne nahi denge, warna fields mismatch ho jayenge
    question.set(cleanQuestion({ ...req.body, type: question.type }, question.source));
    await assessment.save();
    res.json({ assessment });
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const assessment = await findOwned(req.params.id, req.user._id);
    assertDraft(assessment);

    if (!assessment.questions.id(req.params.qid)) {
      return res.status(404).json({ message: "Question not found." });
    }
    assessment.questions.pull(req.params.qid);
    await assessment.save();
    res.json({ assessment });
  } catch (err) {
    next(err);
  }
}