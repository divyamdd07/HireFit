import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function MyJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/jobs/mine").then((res) => setJobs(res.data.jobs)).finally(() => setLoading(false));
  }, []);

  const toggleStatus = async (id) => {
    const res = await api.patch(`/jobs/${id}/status`);
    setJobs(jobs.map((j) => (j._id === id ? res.data.job : j)));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-3xl font-bold">My Jobs</h1>
        <Link to="/jobs/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + New Job
        </Link>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && jobs.length === 0 && <p className="text-gray-400">You haven't posted any job yet.</p>}

      {jobs.map((job) => (
        <div key={job._id} className="bg-white p-5 rounded-xl shadow flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">{job.title}</h2>
            <p className="text-sm text-gray-500 capitalize">{job.status}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm items-center">
            <Link to={`/jobs/${job._id}/applicants`} className="text-blue-600 hover:underline">
              View applicants
            </Link>
            <button onClick={() => toggleStatus(job._id)} className="text-gray-600 hover:underline">
              {job.status === "open" ? "Close" : "Reopen"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}