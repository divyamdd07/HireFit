import { useState } from "react";

const blankMcq = {
  type: "mcq", text: "", skill: "", points: 10, options: ["", "", "", ""], correctIndex: 0,
};
const blankCoding = {
  type: "coding", title: "", text: "", skill: "", points: 20, constraints: "",
  testCases: [{ input: "", expectedOutput: "", isHidden: false }],
};

const inputClass = "w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function QuestionForm({ initial, defaultType = "mcq", onSave, onCancel }) {
  // structuredClone: copy banao taaki original object badle nahi
  const [q, setQ] = useState(() =>
    structuredClone(initial || (defaultType === "mcq" ? blankMcq : blankCoding))
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setQ({ ...q, [field]: value });
  const setOption = (i, value) => set("options", q.options.map((o, idx) => (idx === i ? value : o)));
  const setTest = (i, field, value) =>
    set("testCases", q.testCases.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  const addTest = () => set("testCases", [...q.testCases, { input: "", expectedOutput: "", isHidden: true }]);
  const removeTest = (i) => set("testCases", q.testCases.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(q);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save question.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow space-y-3 border-2 border-blue-200">
      <h3 className="font-semibold uppercase text-sm text-blue-700">
        {initial?._id ? "Edit" : "New"} {q.type} question
      </h3>

      {q.type === "coding" && (
        <input placeholder="Problem title" className={inputClass} value={q.title}
          onChange={(e) => set("title", e.target.value)} required />
      )}
      <textarea rows="4" className={inputClass} required
        placeholder={q.type === "mcq" ? "Question" : "Problem statement (include input/output format)"}
        value={q.text} onChange={(e) => set("text", e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Skill (e.g. React)" className={inputClass} value={q.skill}
          onChange={(e) => set("skill", e.target.value)} />
        <input type="number" min="1" placeholder="Points" className={inputClass} value={q.points}
          onChange={(e) => set("points", e.target.value)} />
      </div>

      {q.type === "mcq" && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Options (select the correct one)</p>
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={q.correctIndex === i}
                onChange={() => set("correctIndex", i)} />
              <input className={inputClass} placeholder={`Option ${String.fromCharCode(65 + i)}`}
                value={opt} onChange={(e) => setOption(i, e.target.value)} />
            </div>
          ))}
        </div>
      )}

      {q.type === "coding" && (
        <>
          <input placeholder="Constraints (optional)" className={inputClass} value={q.constraints}
            onChange={(e) => set("constraints", e.target.value)} />

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Test cases. Sample cases are shown on Run, hidden ones are used only on Submit.
            </p>
            {q.testCases.map((t, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <textarea rows="2" placeholder="Input" className={`${inputClass} font-mono text-sm`}
                    value={t.input} onChange={(e) => setTest(i, "input", e.target.value)} />
                  <textarea rows="2" placeholder="Expected output" className={`${inputClass} font-mono text-sm`}
                    value={t.expectedOutput} onChange={(e) => setTest(i, "expectedOutput", e.target.value)} />
                </div>
                <div className="flex justify-between text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={t.isHidden}
                      onChange={(e) => setTest(i, "isHidden", e.target.checked)} />
                    Hidden
                  </label>
                  {q.testCases.length > 1 && (
                    <button type="button" onClick={() => removeTest(i)} className="text-red-600">Remove</button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={addTest} className="text-sm text-blue-600 hover:underline">
              + Add test case
            </button>
          </div>
        </>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving..." : "Save question"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border">Cancel</button>
      </div>
    </form>
  );
}