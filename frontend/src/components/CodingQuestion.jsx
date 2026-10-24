import { useState } from "react";
import Editor from "@monaco-editor/react";
import api from "../api/axios";
import { LANGUAGES } from "../constants/languages";

export default function CodingQuestion({ attemptId, question, answer, onAnswerChange }) {
  const [languageId, setLanguageId] = useState(answer?.language || LANGUAGES[0].id);
  const language = LANGUAGES.find((l) => l.id === languageId) || LANGUAGES[0];

  // Pehle se saved code ho to wahi, warna starter code
  const [code, setCode] = useState(answer?.code || language.starter);
  const [runResults, setRunResults] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [busy, setBusy] = useState(""); // "" | "run" | "submit"
  const [error, setError] = useState("");

  const handleLanguageChange = (e) => {
    const next = LANGUAGES.find((l) => l.id === e.target.value);
    setLanguageId(next.id);
    setCode(next.starter);
  };

  // action = "run" ya "submit". Dono ka URL bas last word se alag hai
  const send = async (action) => {
    setBusy(action);
    setError("");
    try {
      const res = await api.post(`/attempts/${attemptId}/questions/${question._id}/${action}`, {
        code,
        language: languageId,
      });
      if (action === "run") {
        setRunResults(res.data.results);
        setSubmitResult(null);
      } else {
        setSubmitResult(res.data.result);
        setRunResults(null);
        onAnswerChange(res.data.answer);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  const history = [...(answer?.submissions || [])].reverse();

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* LEFT: problem */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4 self-start">
        <h2 className="text-xl font-semibold">{question.title}</h2>
        <p className="whitespace-pre-wrap text-sm">{question.text}</p>
        {question.constraints && (
          <p className="text-sm text-gray-600"><b>Constraints:</b> {question.constraints}</p>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Examples</h3>
          {question.sampleTestCases.map((t, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 text-xs font-mono">
              <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap">Input:{"\n"}{t.input}</pre>
              <pre className="bg-gray-100 p-2 rounded whitespace-pre-wrap">Output:{"\n"}{t.expectedOutput}</pre>
            </div>
          ))}
          <p className="text-xs text-gray-500">
            + {question.hiddenCount} hidden test cases (only used on Submit)
          </p>
        </div>
      </div>

      {/* RIGHT: editor + results */}
      <div className="space-y-3">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="flex justify-between items-center p-2 border-b">
            <select value={languageId} onChange={handleLanguageChange} className="border rounded p-1 text-sm">
              {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => send("run")} disabled={Boolean(busy)}
                className="px-4 py-1.5 rounded-lg border text-sm hover:bg-gray-50 disabled:opacity-50">
                {busy === "run" ? "Running..." : "▶ Run"}
              </button>
              <button onClick={() => send("submit")} disabled={Boolean(busy)}
                className="px-4 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50">
                {busy === "submit" ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
          <Editor
            height="380px"
            language={language.monaco}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? "")}
            options={{ minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {/* Run result: sample cases */}
        {runResults && (
          <div className="bg-white p-4 rounded-xl shadow space-y-2">
            <h3 className="font-semibold text-sm">Run result (sample test cases)</h3>
            {runResults.map((r, i) => (
              <div key={i} className={`border rounded-lg p-3 text-xs font-mono space-y-1 ${
                r.passed ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
              }`}>
                <div className="font-sans font-semibold text-sm">
                  Case {i + 1}: {r.passed ? "Passed ✓" : r.timedOut ? "Time limit exceeded" : "Failed ✗"}
                </div>
                {!r.passed && (
                  <>
                    <div>Input: {r.input}</div>
                    <div>Expected: {r.expected}</div>
                    <div>Got: {r.actual || "(nothing)"}</div>
                    {r.error && <pre className="text-red-700 whitespace-pre-wrap">{r.error}</pre>}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submit result: sirf counts */}
        {submitResult && (
          <div className="bg-white p-4 rounded-xl shadow space-y-1">
            <h3 className="font-semibold text-sm">Submission result</h3>
            <p className={`text-lg font-bold ${
              submitResult.passed === submitResult.total ? "text-green-600" : "text-orange-600"
            }`}>
              {submitResult.passed} / {submitResult.total} test cases passed
            </p>
            <p className="text-sm text-gray-600">Score for this submission: {submitResult.score} / {question.points}</p>
            {submitResult.error && (
              <pre className="text-xs text-red-700 whitespace-pre-wrap">{submitResult.error}</pre>
            )}
          </div>
        )}

        {/* Submission history */}
        {history.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow space-y-1">
            <h3 className="font-semibold text-sm">Submission history</h3>
            {history.map((s, i) => (
              <div key={i} className="flex justify-between text-sm border-t pt-1">
                <span>{new Date(s.createdAt).toLocaleTimeString()}</span>
                <span>{s.passed}/{s.total} passed</span>
                <button onClick={() => setCode(s.code)} className="text-blue-600 hover:underline">Load code</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}