import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";

const RATINGS = [
  { key: "technical", label: "Technical skills" },
  { key: "communication", label: "Communication" },
  { key: "problemSolving", label: "Problem solving" },
  { key: "cultureFit", label: "Culture fit" },
];

const RECOMMENDATIONS = [
  { value: "strong-yes", label: "Strong yes" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "strong-no", label: "Strong no" },
];

const VERDICT_STYLE = {
  verified: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  gap: "bg-red-100 text-red-700",
  unverified: "bg-gray-100 text-gray-600",
};

// Server ke interview se form ka initial data
const formFrom = (interview) => ({
  notes: interview.notes || "",
  feedback: interview.feedback || "",
  recommendation: interview.recommendation || "",
  ratings: {
    technical: interview.ratings?.technical || "",
    communication: interview.ratings?.communication || "",
    problemSolving: interview.ratings?.problemSolving || "",
    cultureFit: interview.ratings?.cultureFit || "",
  },
});

const Card = ({ title, children }) => (
  <div className="bg-white p-5 rounded-xl shadow space-y-3">
    <h2 className="font-semibold">{title}</h2>
    {children}
  </div>
);

export default function InterviewRoomPage() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(""); // "" | save | questions | summary | complete | cancel | decide
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get(`/recruiter-interviews/${id}`)
      .then((res) => {
        setInterview(res.data.interview);
        setProfile(res.data.profile);
        setForm(formFrom(res.data.interview));
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load interview."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!interview) return <p className="p-6 text-red-600">{error}</p>;

  const editable = interview.status === "scheduled";
  const app = profile.application;
  const resume = app?.resumeData || {};

  // Common wrapper: busy state + error handling
  const run = async (name, work) => {
    setBusy(name);
    setError("");
    setMessage("");
    try {
      await work();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  const base = `/recruiter-interviews/${id}`;

  const save = () =>
    run("save", async () => {
      const res = await api.patch(base, form);
      setInterview(res.data.interview);
      setMessage("Saved.");
    });

  const suggestQuestions = () =>
    run("questions", async () => {
      const res = await api.post(`${base}/suggest-questions`, { count: 6 });
      setInterview(res.data.interview);
    });

  const summarize = () =>
    run("summary", async () => {
      await api.patch(base, form); // pehle latest notes save
      const res = await api.post(`${base}/summarize`);
      setInterview(res.data.interview);
    });

  const complete = () => {
    if (!window.confirm("Complete the interview? You cannot edit notes or ratings after this.")) return;
    run("complete", async () => {
      const res = await api.post(`${base}/complete`, form);
      setInterview(res.data.interview);
      setForm(formFrom(res.data.interview));
    });
  };

  const cancel = () => {
    if (!window.confirm("Cancel this interview?")) return;
    run("cancel", async () => {
      const res = await api.patch(`${base}/cancel`);
      setInterview(res.data.interview);
    });
  };

  // FINAL DECISION: sirf recruiter ke click se
  const decide = (status) => {
    if (!window.confirm(`Mark this candidate as "${status}"? This is your final decision.`)) return;
    run("decide", async () => {
      await api.patch(`/applications/${app._id}/status`, { status });
      setProfile({ ...profile, application: { ...app, status } });
      setMessage(`Candidate marked as ${status}.`);
    });
  };

  const ready =
    RATINGS.every((r) => form.ratings[r.key]) && form.feedback.trim().length >= 10 && form.recommendation;

  const inputClass = "w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <Link to="/recruiter/interviews" className="text-sm text-blue-600">← All interviews</Link>

      {/* Header */}
      <div className="bg-white p-5 rounded-xl shadow flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold">{interview.candidate.name}</h1>
          <p className="text-sm text-gray-500">{interview.candidate.email} • {interview.job.title}</p>
          <p className="text-sm mt-1">
            {new Date(interview.scheduledAt).toLocaleString()} • {interview.durationMinutes} min • {interview.mode}
          </p>
          {interview.meetingLink && (
            <p className="text-sm text-blue-600 break-all">
              {interview.meetingLink.startsWith("http") ? (
                <a href={interview.meetingLink} target="_blank" rel="noreferrer">{interview.meetingLink}</a>
              ) : interview.meetingLink}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700 capitalize">{interview.status}</span>
          {editable && (
            <button onClick={cancel} disabled={Boolean(busy)} className="text-sm text-red-600 hover:underline">
              Cancel interview
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {message && <p className="text-green-700 text-sm">{message}</p>}

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* LEFT: candidate profile */}
        <div className="space-y-5">
          <Card title="Candidate snapshot">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">{app?.atsScore ?? "-"}</div>
                <div className="text-xs text-gray-500">ATS score</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">{app ? `${app.matchPercentage}%` : "-"}</div>
                <div className="text-xs text-gray-500">Job match</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{profile.intelligence.readiness.score ?? "-"}</div>
                <div className="text-xs text-gray-500">Readiness</div>
              </div>
            </div>
            {app && (
              <div className="flex items-center gap-2 text-sm">
                Application status: <StatusBadge status={app.status} />
              </div>
            )}
            <p className="text-xs text-gray-500">
              Experience: {resume.totalYearsExperience ?? "-"} years
              {resume.education?.length > 0 && ` • ${resume.education[0]}`}
            </p>
          </Card>

          <Card title="Claimed vs demonstrated skills">
            {profile.intelligence.skills.length === 0 ? (
              <p className="text-sm text-gray-400">No skill data.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.intelligence.skills.map((s) => (
                  <span key={s.name} className={`px-3 py-1 rounded-full text-xs ${VERDICT_STYLE[s.verdict]}`}>
                    {s.name}{s.demonstrated !== null && ` • ${s.demonstrated}%`}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Green = verified, yellow = partial, red = gap, grey = not tested.
            </p>
            {app?.missingSkills?.length > 0 && (
              <p className="text-sm text-red-600">Missing for this job: {app.missingSkills.join(", ")}</p>
            )}
          </Card>

          <Card title="Assessment results (this job)">
            {profile.assessments.length === 0 && <p className="text-sm text-gray-400">Not attempted.</p>}
            {profile.assessments.map((a, i) => (
              <div key={i} className="text-sm border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-medium">{a.title}</span>
                  <span className="font-bold text-blue-600">{a.percentage}% ({a.totalScore}/{a.maxScore})</span>
                </div>
                <div className="text-xs text-gray-500">
                  {a.skillScores.map((s) => `${s.skill}: ${s.max ? Math.round((s.score / s.max) * 100) : 0}%`).join(" • ")}
                </div>
              </div>
            ))}
          </Card>

          <Card title="Latest AI mock interview (practice)">
            {!profile.mockInterview ? (
              <p className="text-sm text-gray-400">No mock interview taken.</p>
            ) : (
              <div className="text-sm space-y-2">
                <p>
                  <b>{profile.mockInterview.role}</b> • score{" "}
                  <b className="text-blue-600">{profile.mockInterview.overallScore}</b>/100
                </p>
                <p className="text-gray-700">{profile.mockInterview.report?.summary}</p>
                {profile.mockInterview.report?.weakAreas?.length > 0 && (
                  <p className="text-red-600">Weak: {profile.mockInterview.report.weakAreas.join(", ")}</p>
                )}
                <p className="text-xs text-gray-500">This was a practice session, not an official evaluation.</p>
              </div>
            )}
          </Card>

          {resume.strengths?.length > 0 && (
            <Card title="Resume highlights (AI-extracted)">
              <ul className="list-disc ml-5 text-sm space-y-1">
                {resume.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </Card>
          )}
        </div>

        {/* RIGHT: recruiter ka kaam */}
        <div className="space-y-5">
          <Card title="AI suggested questions">
            <p className="text-xs text-gray-500">
              Suggestions only. Use, change or ignore them. Based on weak and untested skills.
            </p>
            {editable && (
              <button onClick={suggestQuestions} disabled={Boolean(busy)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm">
                {busy === "questions" ? "AI is thinking..." : interview.suggestedQuestions.length ? "Regenerate" : "Suggest questions"}
              </button>
            )}
            {interview.suggestedQuestions.map((q, i) => (
              <div key={i} className="border rounded-lg p-3 text-sm space-y-1">
                <p className="font-medium">{i + 1}. {q.question}</p>
                <p className="text-xs text-gray-500">
                  {q.skill && <span className="px-2 py-0.5 bg-gray-100 rounded mr-2">{q.skill}</span>}
                  {q.reason}
                </p>
              </div>
            ))}
          </Card>

          <Card title="Interview notes (private)">
            <textarea rows="8" value={form.notes} disabled={!editable} className={inputClass}
              placeholder="Write your notes during the interview..."
              onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            {editable && (
              <div className="flex gap-3">
                <button onClick={save} disabled={Boolean(busy)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
                  {busy === "save" ? "Saving..." : "Save notes"}
                </button>
                <button onClick={summarize} disabled={Boolean(busy)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50">
                  {busy === "summary" ? "Summarizing..." : "Summarize with AI"}
                </button>
              </div>
            )}
            {interview.aiSummary?.summary && (
              <div className="bg-purple-50 p-3 rounded-lg text-sm space-y-2">
                <p className="text-xs text-purple-700 font-semibold">AI summary of your notes</p>
                <p>{interview.aiSummary.summary}</p>
                {interview.aiSummary.strengths?.length > 0 && (
                  <p className="text-green-700">Strengths: {interview.aiSummary.strengths.join("; ")}</p>
                )}
                {interview.aiSummary.concerns?.length > 0 && (
                  <p className="text-red-600">Concerns: {interview.aiSummary.concerns.join("; ")}</p>
                )}
              </div>
            )}
          </Card>

          <Card title="Your evaluation">
            <div className="grid grid-cols-2 gap-3">
              {RATINGS.map((r) => (
                <label key={r.key} className="text-sm">
                  {r.label}
                  <select value={form.ratings[r.key]} disabled={!editable} className={`${inputClass} mt-1`}
                    onChange={(e) => setForm({ ...form, ratings: { ...form.ratings, [r.key]: e.target.value } })}>
                    <option value="">Select</option>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <textarea rows="4" value={form.feedback} disabled={!editable} className={inputClass}
              placeholder="Overall feedback (required)"
              onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
            <label className="text-sm block">
              Your recommendation
              <select value={form.recommendation} disabled={!editable} className={`${inputClass} mt-1`}
                onChange={(e) => setForm({ ...form, recommendation: e.target.value })}>
                <option value="">Select</option>
                {RECOMMENDATIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
            {editable && (
              <button onClick={complete} disabled={Boolean(busy) || !ready}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                {busy === "complete" ? "Completing..." : "Complete interview"}
              </button>
            )}
          </Card>

          {interview.status === "completed" && app && (
            <Card title="Final decision (yours)">
              <p className="text-sm text-gray-600">
                The interview is complete. Hiring is your decision. Nothing changes until you choose.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => decide("selected")} disabled={Boolean(busy) || app.status === "selected"}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
                  Select candidate
                </button>
                <button onClick={() => decide("rejected")} disabled={Boolean(busy) || app.status === "rejected"}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">
                  Reject candidate
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}