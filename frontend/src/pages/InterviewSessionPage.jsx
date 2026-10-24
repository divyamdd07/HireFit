import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import InterviewReport from "../components/InterviewReport";
import { CRITERIA } from "../constants/criteria";

// Ek answer ho chuka sawal: answer + score + feedback
function AnsweredTurn({ turn, number }) {
  const ev = turn.evaluation;
  return (
    <div className="bg-white p-5 rounded-xl shadow space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div>
          <div className="text-xs text-gray-500">
            Q{number} {turn.topic && `• ${turn.topic}`}
            {turn.isFollowUp && <span className="ml-2 px-2 py-0.5 rounded bg-purple-100 text-purple-700">Follow-up</span>}
          </div>
          <p className="font-medium">{turn.question}</p>
        </div>
        <div className="text-2xl font-bold text-blue-600 shrink-0">{ev?.score}/10</div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg text-sm whitespace-pre-wrap">{turn.answer}</div>

      <p className="text-sm"><b>Feedback:</b> {ev?.feedback}</p>

      <div className="flex flex-wrap gap-2 text-xs">
        {CRITERIA.map((c) => (
          <span key={c.key} className="px-2 py-1 bg-blue-50 text-blue-800 rounded">
            {c.label}: {ev?.scores?.[c.key]}
          </span>
        ))}
      </div>

      {ev?.idealPoints?.length > 0 && (
        <div className="text-sm">
          <b>A strong answer would include:</b>
          <ul className="list-disc ml-5">{ev.idealPoints.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

export default function InterviewSessionPage() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); // AI kaam kar raha hai
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/interviews/${id}`)
      .then((res) => setInterview(res.data.interview))
      .catch((err) => setError(err.response?.data?.message || "Could not load interview."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!interview) return <p className="p-6 text-red-600">{error}</p>;

  const answeredTurns = interview.turns.filter((t) => t.answeredAt);
  const currentTurn = interview.turns.find((t) => !t.answeredAt);
  const completed = interview.status === "completed";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/interviews/${id}/answer`, { answer });
      setInterview(res.data.interview);
      setAnswer("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit the answer.");
    } finally {
      setBusy(false);
    }
  };

  const generateReport = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api.post(`/interviews/${id}/report`);
      setInterview(res.data.interview);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate the report.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      <Link to="/interviews" className="text-sm text-blue-600">← All interviews</Link>

      <div>
        <h1 className="text-3xl font-bold">{interview.role}</h1>
        <p className="text-sm text-gray-500 capitalize">
          {interview.level} • {interview.difficulty} • {interview.type}
        </p>
      </div>

      {completed && <InterviewReport interview={interview} />}

      {answeredTurns.length > 0 && (
        <h2 className="text-xl font-semibold">{completed ? "Question-wise feedback" : "So far"}</h2>
      )}
      {answeredTurns.map((turn, i) => <AnsweredTurn key={turn._id} turn={turn} number={i + 1} />)}

      {/* Abhi ka sawal */}
      {!completed && currentTurn && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-3 border-2 border-blue-200">
          <div className="text-xs text-gray-500">
            Question {answeredTurns.length + 1} of {interview.totalQuestions}
            {currentTurn.isFollowUp && (
              <span className="ml-2 px-2 py-0.5 rounded bg-purple-100 text-purple-700">Follow-up</span>
            )}
          </div>
          <p className="text-lg font-medium">{currentTurn.question}</p>
          <textarea rows="7" value={answer} maxLength={3000} disabled={busy}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{answer.length}/3000</span>
            <button disabled={busy || answer.trim().length < 5}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {busy ? "AI is evaluating... (up to 1 min)" : "Submit answer"}
            </button>
          </div>
        </form>
      )}

      {/* Sab answers ho gaye par report nahi bani */}
      {!completed && !currentTurn && (
        <div className="bg-yellow-50 p-5 rounded-xl space-y-3">
          <p className="text-sm">All questions answered. The final report is not ready yet.</p>
          <button onClick={generateReport} disabled={busy}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {busy ? "Generating..." : "Generate report"}
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}