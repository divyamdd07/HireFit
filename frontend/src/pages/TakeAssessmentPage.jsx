import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import McqQuestion from "../components/McqQuestion";
import CodingQuestion from "../components/CodingQuestion";
import AttemptResult from "../components/AttemptResult";

const formatTime = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

export default function TakeAssessmentPage() {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [endAt, setEndAt] = useState(null); // timer ka end time (browser clock)
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const finishing = useRef(false); // finish do baar call hone se bachane ke liye

  useEffect(() => {
    api.get(`/attempts/${id}`)
      .then((res) => {
        setAttempt(res.data.attempt);
        setAssessment(res.data.assessment);
        // Server batata hai kitna time bacha. Hum apni clock se end time nikalte hain
        setEndAt(Date.now() + res.data.remainingSeconds * 1000);
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load attempt."))
      .finally(() => setLoading(false));
  }, [id]);

  const finish = useCallback(async () => {
    if (finishing.current) return;
    finishing.current = true;
    try {
      const res = await api.post(`/attempts/${id}/finish`);
      setAttempt(res.data.attempt);
    } catch (err) {
      setError(err.response?.data?.message || "Could not finish.");
      finishing.current = false;
    }
  }, [id]);

  // Countdown: har second baki time nikalo, 0 par auto-finish
  useEffect(() => {
    if (!endAt || attempt?.status !== "in-progress") return;

    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) finish();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endAt, attempt?.status, finish]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!attempt) return <p className="p-6 text-red-600">{error}</p>;

  if (attempt.status === "submitted") {
    return <AttemptResult attempt={attempt} assessment={assessment} />;
  }

  const answerFor = (qid) => attempt.answers.find((a) => a.questionId === qid);

  // Local state mein answer update karo (server pe already save ho chuka hota hai)
  const updateAnswer = (qid, patch) => {
    setAttempt((prev) => {
      const exists = prev.answers.some((a) => a.questionId === qid);
      const answers = exists
        ? prev.answers.map((a) => (a.questionId === qid ? { ...a, ...patch } : a))
        : [...prev.answers, { questionId: qid, submissions: [], ...patch }];
      return { ...prev, answers };
    });
  };

  const selectOption = async (question, index) => {
    updateAnswer(question._id, { selectedIndex: index }); // turant UI update
    try {
      await api.put(`/attempts/${id}/answers/${question._id}`, { selectedIndex: index });
    } catch (err) {
      setError(err.response?.data?.message || "Could not save answer.");
    }
  };

  const handleFinish = () => {
    if (window.confirm("Finish and submit the assessment? You cannot change answers after this.")) {
      finish();
    }
  };

  const isAnswered = (q) => {
    const a = answerFor(q._id);
    return q.type === "mcq" ? a?.selectedIndex !== undefined : (a?.submissions?.length || 0) > 0;
  };

  const question = assessment.questions[current];
  const answer = answerFor(question._id);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow">
        <div>
          <h1 className="text-xl font-bold">{assessment.title}</h1>
          <p className="text-sm text-gray-500">Question {current + 1} of {assessment.questions.length} • {question.points} pts</p>
        </div>
        <div className="flex items-center gap-4">
          <div className={`text-2xl font-mono font-bold ${secondsLeft !== null && secondsLeft < 300 ? "text-red-600" : ""}`}>
            ⏱ {secondsLeft === null ? "--:--" : formatTime(secondsLeft)}
          </div>
          <button onClick={handleFinish} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
            Finish
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Question navigation */}
      <div className="flex flex-wrap gap-2">
        {assessment.questions.map((q, i) => (
          <button key={q._id} onClick={() => setCurrent(i)}
            className={`w-10 h-10 rounded-lg border text-sm font-medium ${
              i === current ? "bg-blue-600 text-white border-blue-600"
              : isAnswered(q) ? "bg-green-100 border-green-400" : "bg-white"
            }`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* Current question. key badalne se component reset hota hai */}
      {question.type === "mcq" ? (
        <McqQuestion
          key={question._id}
          question={question}
          selectedIndex={answer?.selectedIndex}
          onSelect={(index) => selectOption(question, index)}
        />
      ) : (
        <CodingQuestion
          key={question._id}
          attemptId={id}
          question={question}
          answer={answer}
          onAnswerChange={(updated) => updateAnswer(question._id, updated)}
        />
      )}

      <div className="flex justify-between">
        <button disabled={current === 0} onClick={() => setCurrent(current - 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-40">← Previous</button>
        <button disabled={current === assessment.questions.length - 1} onClick={() => setCurrent(current + 1)}
          className="px-4 py-2 border rounded-lg disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}