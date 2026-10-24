import fs from "fs/promises";
import path from "path";
import Job from "../models/Job.js";
import Application, { STATUSES } from "../models/Application.js";
import { extractTextFromPdf } from "../services/resumeParser.service.js";
import { analyzeResumeWithAI } from "../services/ai.service.js";
import { calculateAtsScore } from "../services/atsScoring.service.js";
import { notify } from "../services/notification.service.js";
import { emailUser } from "../services/email.service.js";

// Har chhote status pe email nahi bhejte (spam lagta hai)
const EMAIL_STATUSES = ["assessment", "shortlisted", "interview", "selected", "rejected"];

// ---------- CANDIDATE: apply ----------
export async function applyToJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job || job.status !== "open") {
      return res.status(404).json({ message: "Job not found or closed." });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a PDF resume." });
    }

    const already = await Application.findOne({ job: job._id, candidate: req.user._id });
    if (already) {
      return res.status(409).json({ message: "You already applied to this job." });
    }

    // Wahi 3 steps jo Step 1 mein the
    const resumeText = await extractTextFromPdf(req.file.buffer);
    const resumeData = await analyzeResumeWithAI(resumeText, job);
    const score = calculateAtsScore(resumeData, job);

    const application = await Application.create({
      job: job._id,
      candidate: req.user._id,
      resumeFile: req.file.buffer, // PDF seedha MongoDB mein
      resumeData,
      ...score,
    });
        notify(job.recruiter, {
      type: "applicant",
      title: "New applicant",
      message: `${req.user.name} applied for ${job.title} (ATS ${score.atsScore}).`,
      link: `/jobs/${job._id}/applicants`,
    });

       res.status(201).json({
      application: { _id: application._id, status: application.status, atsScore: application.atsScore },
    });
  } catch (err) {
    next(err);
  }
}

// ---------- CANDIDATE: meri applications ----------
export async function getMyApplications(req, res, next) {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate("job", "title location employmentType")
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    next(err);
  }
}

// ---------- RECRUITER: ek job ke applicants ----------
export async function getJobApplicants(req, res, next) {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found." });
    if (job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "This is not your job." });
    }

    const filter = { job: job._id };
    if (req.query.status) filter.status = req.query.status;

    const applications = await Application.find(filter)
      .populate("candidate", "name email")
      .sort({ atsScore: -1 }); // best candidate sabse upar

    res.json({ job, applications });
  } catch (err) {
    next(err);
  }
}

// ---------- RECRUITER: status change ----------
export async function updateApplicationStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const application = await Application.findById(req.params.id).populate("job");
    if (!application) return res.status(404).json({ message: "Application not found." });
    if (application.job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not allowed." });
    }

       const changed = application.status !== status;
    application.status = status;
    await application.save();

    if (changed) {
      notify(application.candidate, {
        type: "status",
        title: "Application update",
        message: `Your application for ${application.job.title} is now "${status}".`,
        link: "/my-applications",
      });
     if (EMAIL_STATUSES.includes(status)) {
        emailUser(application.candidate, {
          subject: `Application update: ${application.job.title}`,
          heading: "Your application status has changed",
          lines: [`Your application for ${application.job.title} is now "${status}".`],
          linkPath: "/my-applications",
          linkText: "View my applications",
        });
      }
    }
    res.json({ status: application.status });
  } catch (err) {
    next(err);
  }
}

// ---------- Resume download (sirf candidate khud ya job ka recruiter hi kregaaaaa) ----------
export async function downloadResume(req, res, next) {
  try {
    const application = await Application.findById(req.params.id)
      .select("+resumeFile")
      .populate("job");
    if (!application) return res.status(404).json({ message: "Application not found." });

    const isOwner = application.candidate.toString() === req.user._id.toString();
    const isJobRecruiter = application.job.recruiter.toString() === req.user._id.toString();
    if (!isOwner && !isJobRecruiter && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed." });
    }

    if (application.resumeFile?.length) {
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=resume.pdf",
      });
      return res.send(application.resumeFile);
    }
    // Purani applications (disk wali), sirf local development mein milti hain
    if (application.resumePath) return res.sendFile(path.resolve(application.resumePath));

    res.status(404).json({ message: "Resume file not found." });
  } catch (err) {
    next(err);
  }
}