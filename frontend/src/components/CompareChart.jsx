import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b"];

const skillPercent = (row, skill) => {
  const s = row.skillScores.find((x) => x.skill === skill);
  return s && s.max ? Math.round((s.score / s.max) * 100) : 0;
};

export default function CompareChart({ rows, onClose }) {
  // Sab selected candidates ki skills ka union
  const skills = [...new Set(rows.flatMap((r) => r.skillScores.map((s) => s.skill)))];

  // recharts ko aisa data chahiye: [{ skill: "React", c0: 80, c1: 60 }, ...]
  const chartData = skills.map((skill) => {
    const point = { skill };
    rows.forEach((row, i) => (point[`c${i}`] = skillPercent(row, skill)));
    return point;
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-5 border-2 border-blue-200">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Candidate comparison</h2>
        <button onClick={onClose} className="text-sm text-gray-500 hover:underline">Close</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Metric</th>
              {rows.map((r) => <th key={r.attemptId} className="p-3">{r.candidate.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              ["Assessment %", (r) => `${r.percentage}%`],
              ["Score", (r) => `${r.totalScore} / ${r.maxScore}`],
              ["Time taken", (r) => (r.minutesTaken !== null ? `${r.minutesTaken} min` : "-")],
              ["ATS score", (r) => r.application?.atsScore ?? "-"],
              ["Job match", (r) => (r.application ? `${r.application.matchPercentage}%` : "-")],
            ].map(([label, getValue]) => (
              <tr key={label} className="border-t">
                <td className="p-3 font-medium">{label}</td>
                {rows.map((r) => <td key={r.attemptId} className="p-3">{getValue(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chartData.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2">Performance by skill (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              {rows.map((r, i) => (
                <Bar key={r.attemptId} dataKey={`c${i}`} name={r.candidate.name} fill={COLORS[i]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}