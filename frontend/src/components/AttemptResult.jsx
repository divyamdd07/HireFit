import { Link } from "react-router-dom";

export default function AttemptResult({ attempt, assessment }) {
  const scoreOf = (qid) => attempt.answers.find((a) => a.questionId === qid)?.score ?? 0;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">{assessment.title} – Result</h1>

      <div className="bg-white p-6 rounded-xl shadow flex justify-around text-center">
        <div>
          <div className="text-5xl font-bold text-blue-600">{attempt.percentage}%</div>
          <div className="text-sm text-gray-500">Percentage</div>
        </div>
        <div>
          <div className="text-5xl font-bold text-green-600">
            {attempt.totalScore}<span className="text-2xl text-gray-400"> / {attempt.maxScore}</span>
          </div>
          <div className="text-sm text-gray-500">Total score</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold">Performance by skill</h2>
        {attempt.skillScores.map((s) => {
          const percent = s.max ? Math.round((s.score / s.max) * 100) : 0;
          return (
            <div key={s.skill}>
              <div className="flex justify-between text-sm">
                <span>{s.skill}</span><span>{percent}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div className="h-2 bg-blue-500 rounded" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr><th className="p-3">#</th><th className="p-3">Question</th><th className="p-3">Type</th><th className="p-3">Score</th></tr>
          </thead>
          <tbody>
            {assessment.questions.map((q, i) => (
              <tr key={q._id} className="border-t">
                <td className="p-3">{i + 1}</td>
                <td className="p-3">{q.title || q.text.slice(0, 70)}</td>
                <td className="p-3 uppercase text-xs">{q.type}</td>
                <td className="p-3">{scoreOf(q._id)} / {q.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link to="/tests" className="text-blue-600">← Back to assessments</Link>
    </div>
  );
}