export default function QuestionCard({ question, index, children }) {
  const sample = question.testCases?.filter((t) => !t.isHidden).length || 0;
  const hidden = question.testCases?.filter((t) => t.isHidden).length || 0;

  return (
    <div className="bg-white p-4 rounded-xl shadow space-y-3">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold">Q{index + 1}</span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">{question.type}</span>
            {question.skill && <span className="px-2 py-0.5 rounded bg-gray-100">{question.skill}</span>}
            <span className="text-gray-500">{question.points} pts</span>
            {question.source === "ai" && (
              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700">AI</span>
            )}
          </div>
          {question.type === "coding" && <h3 className="font-semibold">{question.title}</h3>}
          <p className="text-sm whitespace-pre-wrap">{question.text}</p>
        </div>
        <div className="flex gap-3 text-sm shrink-0">{children}</div>
      </div>

      {question.type === "mcq" && (
        <ul className="text-sm space-y-1">
          {question.options.map((opt, i) => (
            <li key={i} className={i === question.correctIndex ? "text-green-700 font-medium" : "text-gray-700"}>
              {String.fromCharCode(65 + i)}. {opt} {i === question.correctIndex && "✓"}
            </li>
          ))}
        </ul>
      )}

      {question.type === "coding" && (
        <div className="text-sm text-gray-600 space-y-1">
          {question.constraints && <p>Constraints: {question.constraints}</p>}
          <p>{sample} sample + {hidden} hidden test cases</p>
        </div>
      )}
    </div>
  );
}