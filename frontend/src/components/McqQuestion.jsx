export default function McqQuestion({ question, selectedIndex, onSelect }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <p className="whitespace-pre-wrap">{question.text}</p>
      <div className="space-y-2">
        {question.options.map((option, i) => (
          <label
            key={i}
            className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
              selectedIndex === i ? "border-blue-500 bg-blue-50" : ""
            }`}
          >
            <input type="radio" checked={selectedIndex === i} onChange={() => onSelect(i)} />
            <span>{String.fromCharCode(65 + i)}. {option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}