import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function AvailableAssessmentsPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/attempts/available")
      .then((res) => setAssessments(res.data.assessments))
      .catch((err) => setError(err.response?.data?.message || "Could not load assessments."))
      .finally(() => setLoading(false));
  }, []);

  const open = async (assessment) => {
    setError("");
    // Pehle se attempt hai (chal raha ya khatam) to seedha wahi kholo
    if (assessment.attempt) return navigate(`/attempts/${assessment.attempt._id}`);

    const ok = window.confirm(
      `Start "${assessment.title}"?\nThe ${assessment.durationMinutes} minute timer starts immediately and cannot be paused.`
    );
    if (!ok) return;

    try {
      const res = await api.post(`/attempts/start/${assessment._id}`);
      navigate(`/attempts/${res.data.attemptId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not start.");
    }
  };

  const buttonText = (attempt) =>
    !attempt ? "Start" : attempt.status === "in-progress" ? "Continue" : "View result";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">My Assessments</h1>
      <p className="text-sm text-gray-500">Assessments of the jobs you applied to appear here.</p>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && assessments.length === 0 && (
        <p className="text-gray-400">No assessments available yet.</p>
      )}

      {assessments.map((a) => (
        <div key={a._id} className="bg-white p-5 rounded-xl shadow flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">{a.title}</h2>
            <p className="text-sm text-gray-500">
              {a.job?.title} • {a.questionCount} questions • {a.durationMinutes} min • {a.difficulty}
            </p>
            {a.attempt?.status === "submitted" && (
              <p className="text-sm text-green-700 mt-1">Score: {a.attempt.percentage}%</p>
            )}
          </div>
          <button onClick={() => open(a)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            {buttonText(a.attempt)}
          </button>
        </div>
      ))}
    </div>
  );
}