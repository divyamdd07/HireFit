const colors = {
  applied: "bg-gray-100 text-gray-700",
  screening: "bg-blue-100 text-blue-700",
  assessment: "bg-purple-100 text-purple-700",
  shortlisted: "bg-green-100 text-green-700",
  interview: "bg-yellow-100 text-yellow-700",
  selected: "bg-emerald-200 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${colors[status]}`}>
      {status}
    </span>
  );
}