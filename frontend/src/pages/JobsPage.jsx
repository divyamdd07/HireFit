import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function JobCard({ job }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApply = async () => {
    if (!file) return setError("Please choose a PDF resume.");
    setLoading(true);
    setError("");

    const data = new FormData();
    data.append("resume", file);

    try {
      await api.post(`/applications/apply/${job._id}`, data);
      navigate("/my-applications");
    } catch (err) {
      setError(err.response?.data?.message || "Could not apply.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{job.title}</h2>
        <p className="text-sm text-gray-500">
          {job.recruiter?.recruiterProfile?.companyName || job.recruiter?.name} • {job.location || "Remote"} • {job.employmentType} • {job.minExperience}+ yrs
        </p>
      </div>
      <p className="text-sm text-gray-700 line-clamp-3">{job.description}</p>
      <div className="flex flex-wrap gap-2">
        {job.requiredSkills.map((s) => (
          <span key={s} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{s}</span>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <input type="file" accept="application/pdf" className="text-sm"
          onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handleApply} disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? "AI is analyzing..." : "Apply"}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/jobs").then((res) => setJobs(res.data.jobs)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Open Jobs</h1>
      {loading && <p>Loading...</p>}
      {!loading && jobs.length === 0 && <p className="text-gray-400">No open jobs right now.</p>}
      {jobs.map((job) => <JobCard key={job._id} job={job} />)}
    </div>
  );
}