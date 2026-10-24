import { useState } from "react";
import api from "../api/axios";
import ScoreCircle from "../components/ScoreCircle";
import SkillList from "../components/SkillList";



export default function AtsPage() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    preferredSkills: "",
    minExperience: 0,
  });
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please choose a PDF resume.");

    setLoading(true);
    setError("");
    setResult(null);

    const data = new FormData();
    data.append("resume", file);
    Object.entries(form).forEach(([key, value]) => data.append(key, value));

    try {
      const res = await api.post("/ats/analyze", data);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Smart ATS Resume Analyzer</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LEFT: form */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
            <input name="title" placeholder="Job title (e.g. MERN Developer)"
              className={inputClass} onChange={handleChange} required />
            <textarea name="description" rows="4" placeholder="Job description"
              className={inputClass} onChange={handleChange} required />
            <input name="requiredSkills" placeholder="Required skills (comma separated)"
              className={inputClass} onChange={handleChange} />
            <input name="preferredSkills" placeholder="Preferred skills (comma separated)"
              className={inputClass} onChange={handleChange} />
            <input name="minExperience" type="number" min="0" placeholder="Min years of experience"
              className={inputClass} onChange={handleChange} />
            <input type="file" accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])} />

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>
          </form>

          {/* RIGHT: result */}
          <div className="bg-white p-6 rounded-xl shadow space-y-6">
            {!result && !loading && (
              <p className="text-gray-400">Your analysis will appear here.</p>
            )}
            {loading && <p className="text-gray-500">AI is reading the resume...</p>}

            {result && (
              <>
                <div className="flex justify-around">
                  <ScoreCircle score={result.atsScore} />
                  <div className="text-center">
                    <div className="text-6xl font-bold text-blue-600">{result.matchPercentage}%</div>
                    <div className="text-sm text-gray-500">Job Match</div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Score breakdown</h3>
                  {Object.entries(result.breakdown).map(([name, b]) => (
                    <div key={name} className="flex justify-between text-sm py-1 border-b">
                      <span className="capitalize">{name}</span>
                      <span>{b.score} / {b.max}</span>
                    </div>
                  ))}
                </div>

                <SkillList title="Matching skills" skills={result.matchingSkills} color="green" />
                <SkillList title="Missing required skills" skills={result.missingSkills} color="red" />

                <div>
                  <h3 className="font-semibold mb-2">Strengths</h3>
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {result.resumeData.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Improvement suggestions</h3>
                  <ul className="list-disc ml-5 text-sm space-y-1">
                    {result.resumeData.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}