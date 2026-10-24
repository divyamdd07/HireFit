import Job from "../models/Job.js";
import Application, { STATUSES } from "../models/Application.js";
import Assessment from "../models/Assessment.js";
import Attempt from "../models/Attempt.js";
import RecruiterInterview from "../models/RecruiterInterview.js";
const average = (numbers) =>
  numbers.length ? Math.round(numbers.reduce((sum, n) => sum + n, 0) / numbers.length) : 0;

export async function getRecruiterDashboard(req, res, next) {
  try {
    const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 });

    // Applications ATS score ke hisaab se sorted (best pehle)
    const applications = await Application.find({ job: { $in: jobs.map((j) => j._id) } })
      .populate("candidate", "name email")
      .populate("job", "title")
      .sort({ atsScore: -1 });

    const assessments = await Assessment.find({ recruiter: req.user._id }).select("title status");
    const attempts = await Attempt.find({
      assessment: { $in: assessments.map((a) => a._id) },
    }).select("assessment status percentage");

    // 1) Upar ke stat cards
    const stats = {
      activeJobs: jobs.filter((j) => j.status === "open").length,
      totalJobs: jobs.length,
      totalApplicants: applications.length,
      shortlisted: applications.filter((a) => a.status === "shortlisted").length,
      averageAts: average(applications.map((a) => a.atsScore)),
    };

    // 2) Hiring pipeline: har status mein kitne
    const pipeline = STATUSES.map((status) => ({
      status,
      count: applications.filter((a) => a.status === status).length,
    }));

    // 3) Har job ke applicants
    const jobRows = jobs.map((job) => {
      const jobApps = applications.filter((a) => a.job?._id.toString() === job._id.toString());
      return {
        _id: job._id,
        title: job.title,
        status: job.status,
        applicants: jobApps.length,
        averageAts: average(jobApps.map((a) => a.atsScore)),
      };
    });

    // 4) Top 5 candidates (rejected ko chhod ke)
    const topCandidates = applications
      .filter((a) => a.status !== "rejected")
      .slice(0, 5)
      .map((a) => ({
        applicationId: a._id,
        name: a.candidate?.name,
        email: a.candidate?.email,
        jobId: a.job?._id,
        jobTitle: a.job?.title,
        atsScore: a.atsScore,
        matchPercentage: a.matchPercentage,
        status: a.status,
      }));

    // 5) Assessment analytics
    const assessmentRows = assessments.map((assessment) => {
      const mine = attempts.filter((t) => t.assessment.toString() === assessment._id.toString());
      const submitted = mine.filter((t) => t.status === "submitted");
      return {
        _id: assessment._id,
        title: assessment.title,
        status: assessment.status,
        started: mine.length,
        submitted: submitted.length,
        averagePercentage: average(submitted.map((t) => t.percentage)),
      };
    });

        // 6) Upcoming interviews
    const upcomingInterviews = await RecruiterInterview.find({
      recruiter: req.user._id,
      status: "scheduled",
      scheduledAt: { $gte: new Date() },
    })
      .populate("candidate", "name")
      .populate("job", "title")
      .sort({ scheduledAt: 1 })
      .limit(5);

        res.json({ stats, pipeline, jobs: jobRows, topCandidates, assessments: assessmentRows, upcomingInterviews });
  } catch (err) {
    next(err);
  }
}