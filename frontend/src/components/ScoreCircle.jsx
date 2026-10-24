export default function ScoreCircle({ score }) {
  const color =
    score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="flex flex-col items-center">
      <div className={`text-6xl font-bold ${color}`}>{score}</div>
      <div className="text-sm text-gray-500">ATS Score / 100</div>
    </div>
  );
}