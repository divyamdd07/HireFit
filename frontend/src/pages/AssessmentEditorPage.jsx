import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";
import QuestionCard from "../components/QuestionCard";
import QuestionForm from "../components/QuestionForm";

export default function AssessmentEditorPage() {
  const { id } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // editing: null | {mode:"new", type} | {mode:"edit", question} | {mode:"suggestion", index}
  const [editing, setEditing] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [counts, setCounts] = useState({ mcqCount: 3, codingCount: 1 });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get(`/assessments/${id}`)
      .then((res) => setAssessment(res.data.assessment))
      .catch((err) => setError(err.response?.data?.message || "Could not load assessment."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!assessment) return <p className="p-6 text-red-600">{error}</p>;

  const isDraft = assessment.status === "draft";
  const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);

  const addQuestion = async (q) => {
    const res = await api.post(`/assessments/${id}/questions`, q);
    setAssessment(res.data.assessment);
  };

  // QuestionForm ke Save pe: errors form ke andar dikhte hain (throw hone dete hain)
  const saveEditing = async (q) => {
    if (editing.mode === "edit") {
      const res = await api.put(`/assessments/${id}/questions/${editing.question._id}`, q);
      setAssessment(res.data.assessment);
    } else {
      await addQuestion(q);
      if (editing.mode === "suggestion") {
        setSuggestions(suggestions.filter((_, i) => i !== editing.index));
      }
    }
    setEditing(null);
  };

  const removeQuestion = async (qid) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      const res = await api.delete(`/assessments/${id}/questions/${qid}`);
      setAssessment(res.data.assessment);
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete.");
    }
  };

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await api.post(`/assessments/${id}/generate`, counts);
      setSuggestions(res.data.suggestions);
      if (res.data.suggestions.length === 0) setError("AI did not return valid questions. Try again.");
    } catch (err) {
      setError(err.response?.data?.message || "AI generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const addSuggestion = async (index) => {
    try {
      await addQuestion(suggestions[index]);
      setSuggestions(suggestions.filter((_, i) => i !== index));
    } catch (err) {
      setError(err.response?.data?.message || "Could not add question.");
    }
  };

  const togglePublish = async () => {
    setError("");
    try {
      const status = isDraft ? "published" : "draft";
      const res = await api.patch(`/assessments/${id}/status`, { status });
      setAssessment(res.data.assessment);
    } catch (err) {
      setError(err.response?.data?.message || "Could not change status.");
    }
  };

  // Form ko kya initial data dein
  let formInitial;
  if (editing?.mode === "edit") formInitial = editing.question;
  if (editing?.mode === "suggestion") formInitial = suggestions[editing.index];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link to="/assessments" className="text-sm text-blue-600">← All assessments</Link>
      <Link to={`/assessments/${id}/results`} className="text-sm text-blue-600 ml-4">View results →</Link>

      <div className="flex justify-between items-start gap-3">
        <div>
          <h1 className="text-3xl font-bold">{assessment.title}</h1>
          <p className="text-gray-500 text-sm">
            {assessment.job?.title} • {assessment.durationMinutes} min • {assessment.difficulty} •{" "}
            {assessment.questions.length} questions • {totalPoints} points
          </p>
          <p className="text-gray-500 text-sm">Skills: {assessment.skills.join(", ") || "-"}</p>
        </div>
        <button onClick={togglePublish}
          className={`px-4 py-2 rounded-lg text-white ${isDraft ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}`}>
          {isDraft ? "Publish" : "Unpublish"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!isDraft && (
        <p className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
          This assessment is published. Unpublish it to edit questions.
        </p>
      )}

      {/* Questions */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Questions</h2>
          {isDraft && (
            <div className="flex gap-3 text-sm">
              <button onClick={() => setEditing({ mode: "new", type: "mcq" })} className="text-blue-600 hover:underline">
                + MCQ
              </button>
              <button onClick={() => setEditing({ mode: "new", type: "coding" })} className="text-blue-600 hover:underline">
                + Coding
              </button>
            </div>
          )}
        </div>

        {editing && (
          <QuestionForm
            key={`${editing.mode}-${editing.question?._id ?? editing.index ?? editing.type}`}
            initial={formInitial}
            defaultType={editing.type}
            onSave={saveEditing}
            onCancel={() => setEditing(null)}
          />
        )}

        {assessment.questions.length === 0 && !editing && (
          <p className="text-gray-400">No questions yet. Add manually or generate with AI below.</p>
        )}

        {assessment.questions.map((q, i) => (
          <QuestionCard key={q._id} question={q} index={i}>
            {isDraft && (
              <>
                <button onClick={() => setEditing({ mode: "edit", question: q })} className="text-blue-600 hover:underline">
                  Edit
                </button>
                <button onClick={() => removeQuestion(q._id)} className="text-red-600 hover:underline">
                  Delete
                </button>
              </>
            )}
          </QuestionCard>
        ))}
      </section>

      {/* AI generation */}
      {isDraft && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">AI question suggestions</h2>
          <div className="bg-white p-5 rounded-xl shadow flex flex-wrap items-end gap-4">
            <label className="text-sm">
              MCQs
              <input type="number" min="0" max="10" value={counts.mcqCount}
                onChange={(e) => setCounts({ ...counts, mcqCount: e.target.value })}
                className="block w-20 border rounded-lg p-2 mt-1" />
            </label>
            <label className="text-sm">
              Coding
              <input type="number" min="0" max="5" value={counts.codingCount}
                onChange={(e) => setCounts({ ...counts, codingCount: e.target.value })}
                className="block w-20 border rounded-lg p-2 mt-1" />
            </label>
            <button onClick={generate} disabled={generating}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
              {generating ? "AI is thinking... (up to 1-2 min)" : suggestions.length ? "Regenerate" : "Generate with AI"}
            </button>
          </div>

          {suggestions.length > 0 && (
            <p className="text-sm text-gray-500">
              These are only suggestions. Review them (especially coding test-case outputs) before adding.
            </p>
          )}

          {suggestions.map((q, i) => (
            <QuestionCard key={i} question={q} index={i}>
              <button onClick={() => addSuggestion(i)} className="text-green-700 hover:underline">Add</button>
              <button onClick={() => setEditing({ mode: "suggestion", index: i })} className="text-blue-600 hover:underline">
                Edit first
              </button>
              <button onClick={() => setSuggestions(suggestions.filter((_, idx) => idx !== i))}
                className="text-red-600 hover:underline">
                Discard
              </button>
            </QuestionCard>
          ))}
        </section>
      )}
    </div>
  );
}