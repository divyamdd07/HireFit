import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const inputClass = "w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function InterviewsPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    role: "", level: "fresher", difficulty: "medium", type: "technical", totalQuestions: 5,
  });

  useEffect(() => {
    api.get("/interviews/mine")
      .then((res) => setInterviews(res.data.interviews))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleStart = async (e) => {
    e.preventDefault();
    setStarting(true);
    setError("");
    try {
      const res = await api.post("/interviews", form);
      navigate(`/interviews/${res.data.interview._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not start the interview.");
      setStarting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">AI Mock Interview</h1>

      <form onSubmit={handleStart} className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold">Start a new interview</h2>
        <input name="role" placeholder="Role (e.g. MERN Stack Developer)" className={inputClass}
          required value={form.role} onChange={handleChange} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select name="level" value={form.level} onChange={handleChange} className={inputClass}>
            <option value="fresher">Fresher</option>
            <option value="junior">Junior</option>
            <option value="mid">Mid-level</option>
            <option value="senior">Senior</option>
          </select>
          <select name="difficulty" value={form.difficulty} onChange={handleChange} className={inputClass}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
            <option value="technical">Technical</option>
            <option value="hr">HR / Behavioral</option>
            <option value="mixed">Mixed</option>
          </select>
          <input name="totalQuestions" type="number" min="3" max="10" value={form.totalQuestions}
            onChange={handleChange} className={inputClass} title="Number of questions" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={starting}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {starting ? "AI is preparing your first question..." : "Start interview"}
        </button>
      </form>

      <h2 className="text-xl font-semibold">Past interviews</h2>
      {loading && <p>Loading...</p>}
      {!loading && interviews.length === 0 && <p className="text-gray-400">No interviews yet.</p>}

      {interviews.map((i) => (
        <Link key={i._id} to={`/interviews/${i._id}`}
          className="bg-white p-4 rounded-xl shadow flex justify-between items-center hover:bg-gray-50">
          <div>
            <div className="font-semibold">{i.role}</div>
            <div className="text-sm text-gray-500 capitalize">
              {i.level} • {i.difficulty} • {i.type} • {new Date(i.createdAt).toLocaleDateString()}
            </div>
          </div>
          {i.status === "completed" ? (
            <span className="text-2xl font-bold text-blue-600">{i.overallScore}</span>
          ) : (
            <span className="text-sm text-yellow-700">In progress ({i.answeredCount}/{i.totalQuestions})</span>
          )}
        </Link>
      ))}
    </div>
  );
}