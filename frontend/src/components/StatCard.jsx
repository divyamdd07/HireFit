export default function StatCard({ label, value, color = "text-blue-600" }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}