import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const inputClass = "w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function MyAssessmentsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    jobId: "", title: "", durationMinutes: 60, difficulty: "medium", skills: "",
  });

  useEffect(() => {
    Promise.all([api.get("/jobs/mine"), api.get("/assessments/mine")])
      .then(([jobsRes, assessmentsRes]) => {
        setJobs(jobsRes.data.jobs);
        setAssessments(assessmentsRes.data.assessments);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Job chunte hi uske required skills form mein bhar do
  const handleJobChange = (e) => {
    const job = jobs.find((j) => j._id === e.target.value);
    setForm({
      ...form,
      jobId: e.target.value,
      skills: job ? job.requiredSkills.join(", ") : "",
      title: form.title || (job ? `${job.title} Assessment` : ""),
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/assessments", form);
      navigate(`/assessments/${res.data.assessment._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create assessment.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Assessments</h1>

      <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold">Create new assessment</h2>
        {!loading && jobs.length === 0 && (
          <p className="text-sm text-gray-500">
            You need a job first. <Link to="/jobs/new" className="text-blue-600">Post a job</Link>
          </p>
        )}
        <select name="jobId" value={form.jobId} onChange={handleJobChange} className={inputClass} required>
          <option value="">Select job</option>
          {jobs.map((j) => <option key={j._id} value={j._id}>{j.title}</option>)}
        </select>
        <input name="title" placeholder="Assessment title" value={form.title}
          className={inputClass} required onChange={handleChange} />
        <div className="grid grid-cols-2 gap-3">
          <input name="durationMinutes" type="number" min="5" value={form.durationMinutes}
            className={inputClass} onChange={handleChange} />
          <select name="difficulty" value={form.difficulty} className={inputClass} onChange={handleChange}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <input name="skills" placeholder="Skills to test (comma separated)" value={form.skills}
          className={inputClass} onChange={handleChange} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create</button>
      </form>

      {loading && <p>Loading...</p>}
      {!loading && assessments.length === 0 && <p className="text-gray-400">No assessments yet.</p>}

      {assessments.map((a) => (
        <div key={a._id} className="bg-white p-5 rounded-xl shadow flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">{a.title}</h2>
            <p className="text-sm text-gray-500">
              {a.job?.title} • {a.questions.length} questions • {a.durationMinutes} min • {a.difficulty}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className={`px-3 py-1 rounded-full capitalize ${
              a.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
            }`}>{a.status}</span>
            <Link to={`/assessments/${a._id}`} className="text-blue-600 hover:underline">Open</Link>
            <Link to={`/assessments/${a._id}/results`} className="text-blue-600 hover:underline">Results</Link>
          </div>
        </div>
      ))}
    </div>
  );
}