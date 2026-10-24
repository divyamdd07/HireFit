import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";

export default function AttemptDetailPage() {
  const { id, attemptId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/assessments/${id}/results/${attemptId}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load details."))
      .finally(() => setLoading(false));
  }, [id, attemptId]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!data) return <p className="p-6 text-red-600">{error}</p>;

  const { candidate, attempt, application, questions } = data;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-5">
      <Link to={`/assessments/${id}/results`} className="text-sm text-blue-600">← Back to results</Link>

      <div className="bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold">{candidate.name}</h1>
        <p className="text-gray-500 text-sm">{candidate.email}</p>
        <div className="flex flex-wrap gap-8 mt-4">
          <div>
            <div className="text-3xl font-bold text-blue-600">{attempt.percentage}%</div>
            <div className="text-xs text-gray-500">Assessment ({attempt.totalScore}/{attempt.maxScore})</div>
          </div>
          {application && (
            <>
              <div>
                <div className="text-3xl font-bold text-green-600">{application.atsScore}</div>
                <div className="text-xs text-gray-500">ATS score</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{application.matchPercentage}%</div>
                <div className="text-xs text-gray-500">Job match</div>
              </div>
            </>
          )}
          <div>
            <div className="text-3xl font-bold">{attempt.minutesTaken ?? "-"}</div>
            <div className="text-xs text-gray-500">Minutes taken</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold">Performance by skill</h2>
        {attempt.skillScores.map((s) => {
          const percent = s.max ? Math.round((s.score / s.max) * 100) : 0;
          return (
            <div key={s.skill}>
              <div className="flex justify-between text-sm"><span>{s.skill}</span><span>{percent}%</span></div>
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-2 bg-blue-500 rounded" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-xl font-semibold">Question-wise performance</h2>
      {questions.map((q, i) => (
        <div key={q._id} className="bg-white p-5 rounded-xl shadow space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">
              Q{i + 1} <span className="uppercase text-xs text-blue-700">{q.type}</span>{" "}
              {q.skill && <span className="text-gray-500">• {q.skill}</span>}
            </span>
            <span className="font-semibold">{q.score} / {q.points}</span>
          </div>
          {q.title && <h3 className="font-semibold">{q.title}</h3>}
          <p className="text-sm whitespace-pre-wrap">{q.text}</p>

          {q.type === "mcq" && (
            <ul className="text-sm space-y-1">
              {q.options.map((opt, idx) => (
                <li key={idx} className={
                  idx === q.correctIndex ? "text-green-700 font-medium"
                  : idx === q.selectedIndex ? "text-red-600" : "text-gray-600"
                }>
                  {String.fromCharCode(65 + idx)}. {opt}
                  {idx === q.correctIndex && " ✓ correct"}
                  {idx === q.selectedIndex && idx !== q.correctIndex && " ← candidate's answer"}
                </li>
              ))}
              {q.selectedIndex === null && <li className="text-gray-400">Not answered</li>}
            </ul>
          )}

          {q.type === "coding" && (
            <>
              <p className="text-sm text-gray-600">
                {q.submissionCount} submission(s) • best: {q.bestPassed}/{q.bestTotal} test cases passed
              </p>
              {q.code && (
                <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-lg overflow-x-auto">{q.code}</pre>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}