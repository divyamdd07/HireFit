import { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/jobs")
      .then((res) => setJobs(res.data.jobs))
      .catch((err) => setError(err.response?.data?.message || "Could not load jobs."))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (job) => {
    const action = job.status === "open" ? "close" : "reopen";
    if (!window.confirm(`Do you want to ${action} "${job.title}"?`)) return;
    try {
      const res = await api.patch(`/admin/jobs/${job._id}/status`);
      setJobs(jobs.map((j) => (j._id === job._id ? res.data.job : j)));
    } catch (err) {
      setError(err.response?.data?.message || "Could not update job.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">All jobs (moderation)</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && jobs.length === 0 && <p className="text-gray-400">No jobs yet.</p>}

      {jobs.map((job) => (
        <div key={job._id} className="bg-white p-4 rounded-xl shadow flex flex-wrap justify-between items-center gap-3">
          <div>
            <h2 className="font-semibold">{job.title}</h2>
            <p className="text-sm text-gray-500">
              {job.recruiter?.name} ({job.recruiter?.email}) • {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`px-3 py-1 rounded-full capitalize ${
              job.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>{job.status}</span>
            <button onClick={() => toggle(job)} className="text-blue-600 hover:underline">
              {job.status === "open" ? "Close" : "Reopen"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}