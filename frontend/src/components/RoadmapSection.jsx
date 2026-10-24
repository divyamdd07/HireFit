const PRIORITY = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export default function RoadmapSection({ roadmap, busy, error, onGenerate }) {
  const hasItems = roadmap?.items?.length > 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <div className="flex justify-between items-center gap-3">
        <div>
          <h2 className="font-semibold">Recommended learning roadmap</h2>
          {roadmap?.generatedAt && (
            <p className="text-xs text-gray-500">
              Generated on {new Date(roadmap.generatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <button onClick={onGenerate} disabled={busy}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 shrink-0">
          {busy ? "AI is planning..." : hasItems ? "Regenerate" : "Generate with AI"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!hasItems && !busy && (
        <p className="text-sm text-gray-400">
          Your roadmap is based on your weak skills, missing job skills and mock interview feedback.
        </p>
      )}

      {hasItems && (
        <div className="space-y-3">
          {roadmap.items.map((item, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{i + 1}. {item.title}</span>
                <span className={`px-2 py-0.5 rounded text-xs capitalize ${PRIORITY[item.priority]}`}>
                  {item.priority}
                </span>
                <span className="text-xs text-gray-500">~{item.estimatedWeeks} week(s)</span>
              </div>
              <p className="text-sm text-gray-700">{item.why}</p>
              <ul className="list-disc ml-5 text-sm space-y-1">
                {item.steps.map((step, idx) => <li key={idx}>{step}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}