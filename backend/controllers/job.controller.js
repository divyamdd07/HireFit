import Job from "../models/Job.js";

// "React, Node" ya ["React","Node"] dono chalega
const toList = (value) => {
  if (Array.isArray(value)) return value.map((s) => String(s).trim()).filter(Boolean);
  return (value || "").split(",").map((s) => s.trim()).filter(Boolean);
};

export async function createJob(req, res, next) {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const job = await Job.create({
      recruiter: req.user._id,
      title,
      description,
      requiredSkills: toList(req.body.requiredSkills),
      preferredSkills: toList(req.body.preferredSkills),
      minExperience: Number(req.body.minExperience) || 0,
      education: req.body.education,
      location: req.body.location,
      employmentType: req.body.employmentType,
    });

    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
}

// Sabke liye: open jobs
export async function getOpenJobs(req, res, next) {
  try {
    const jobs = await Job.find({ status: "open" })
      .populate("recruiter", "name recruiterProfile.companyName")
      .sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
}

// Recruiter ki apni jobs
export async function getMyJobs(req, res, next) {
  try {
    const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
}

// Job open/closed toggle (sirf owner)
export async function toggleJobStatus(req, res, next) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });
    if (job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "This is not your job." });
    }

    job.status = job.status === "open" ? "closed" : "open";
    await job.save();
    res.json({ job });
  } catch (err) {
    next(err);
  }
}