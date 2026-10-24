import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

const LABELS = { ats: "ATS score", coding: "Coding", interview: "Interview", jobMatch: "Job match" };

export default function ReadinessCard({ readiness, components }) {
  if (readiness.score === null) {
    return (
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-1">Overall readiness</h2>
        <p className="text-sm text-gray-400">
          No data yet. Apply to a job, take an assessment or a mock interview to get your score.
        </p>
      </div>
    );
  }

  const color =
    readiness.score >= 75 ? "text-green-600" : readiness.score >= 55 ? "text-yellow-600" : "text-red-600";

  // Radar chart ko missing data pe 0 dikhana hai
  const chartData = Object.keys(LABELS).map((key) => ({ metric: LABELS[key], value: components[key] ?? 0 }));

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <h2 className="font-semibold">Overall readiness</h2>

      <div className="grid md:grid-cols-2 gap-4 items-center">
        <div className="text-center">
          <div className={`text-7xl font-bold ${color}`}>{readiness.score}</div>
          <div className="text-sm text-gray-500">out of 100</div>
          <div className={`font-semibold mt-1 ${color}`}>{readiness.label}</div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" />
            <PolarRadiusAxis domain={[0, 100]} tick={false} />
            <Radar dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <table className="w-full text-sm">
        <thead className="text-left bg-gray-100">
          <tr><th className="p-2">Component</th><th className="p-2">Score</th><th className="p-2">Weight</th><th className="p-2">Contribution</th></tr>
        </thead>
        <tbody>
          {readiness.breakdown.map((b) => (
            <tr key={b.key} className="border-t">
              <td className="p-2">{LABELS[b.key]}</td>
              <td className="p-2">{b.value}</td>
              <td className="p-2">{b.weightPercent}%</td>
              <td className="p-2">{b.contribution}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {readiness.missing.length > 0 && (
        <p className="text-xs text-gray-500">
          Not included yet: {readiness.missing.map((k) => LABELS[k]).join(", ")}. The score is calculated from the
          available parts, and will change when you complete them.
        </p>
      )}
    </div>
  );
}