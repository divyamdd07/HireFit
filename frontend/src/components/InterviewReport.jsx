import { CRITERIA } from "../constants/criteria";

function ListBlock({ title, items, color }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <h3 className={`font-semibold mb-2 ${color}`}>{title}</h3>
      {items?.length ? (
        <ul className="list-disc ml-5 text-sm space-y-1">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">None</p>
      )}
    </div>
  );
}

export default function InterviewReport({ interview }) {
  const { report, overallScore, turns } = interview;
  const answered = turns.filter((t) => t.answeredAt);

  // Har criterion ka average (0-10)
  const averages = CRITERIA.map((c) => {
    const total = answered.reduce((sum, t) => sum + (t.evaluation?.scores?.[c.key] || 0), 0);
    return { ...c, value: answered.length ? Math.round((total / answered.length) * 10) / 10 : 0 };
  });

  const color = overallScore >= 75 ? "text-green-600" : overallScore >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow flex flex-col md:flex-row gap-6 items-center">
        <div className="text-center">
          <div className={`text-6xl font-bold ${color}`}>{overallScore}</div>
          <div className="text-sm text-gray-500">Overall score / 100</div>
        </div>
        <p className="text-sm flex-1">{report?.summary}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h3 className="font-semibold">Average by criteria (out of 10)</h3>
        {averages.map((a) => (
          <div key={a.key}>
            <div className="flex justify-between text-sm"><span>{a.label}</span><span>{a.value}</span></div>
            <div className="h-2 bg-gray-200 rounded">
              <div className="h-2 bg-blue-500 rounded" style={{ width: `${a.value * 10}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ListBlock title="Strengths" items={report?.strengths} color="text-green-700" />
        <ListBlock title="Weak areas" items={report?.weakAreas} color="text-red-700" />
        <ListBlock title="Recommended topics" items={report?.recommendedTopics} color="text-blue-700" />
        <ListBlock title="Improvement suggestions" items={report?.suggestions} color="text-purple-700" />
      </div>
    </div>
  );
}