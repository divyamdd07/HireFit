import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ReadinessCard from "../components/ReadinessCard";
import SkillComparison from "../components/SkillComparison";
import RoadmapSection from "../components/RoadmapSection";
import StatusBadge from "../components/StatusBadge";

function Chips({ title, items, style }) {
  return (
    <div>
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className={`px-3 py-1 rounded-full text-sm ${style}`}>{item}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roadmapBusy, setRoadmapBusy] = useState(false);
  const [roadmapError, setRoadmapError] = useState("");

  useEffect(() => {
    api.get("/intelligence/me")
      .then((res) => {
        setData(res.data.intelligence);
        setRoadmap(res.data.roadmap);
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load your dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const generateRoadmap = async () => {
    setRoadmapBusy(true);
    setRoadmapError("");
    try {
      const res = await api.post("/intelligence/roadmap");
      setRoadmap(res.data.roadmap);
    } catch (err) {
      setRoadmapError(err.response?.data?.message || "Could not generate the roadmap.");
    } finally {
      setRoadmapBusy(false);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!data) return <p className="p-6 text-red-600">{error}</p>;

  const steps = [
    { done: data.progress.resume, text: "Apply to a job with your resume", to: "/jobs" },
    { done: data.progress.assessment, text: "Complete a coding assessment", to: "/tests" },
    { done: data.progress.interview, text: "Finish an AI mock interview", to: "/interviews" },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        {data.targetRole && <p className="text-gray-500">Latest target role: {data.targetRole}</p>}
      </div>

      {/* Progress */}
      <div className="bg-white p-5 rounded-xl shadow">
        <div className="flex justify-between mb-2">
          <h2 className="font-semibold">Your journey</h2>
          <span className="text-sm text-gray-500">{doneCount}/3 completed</span>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {steps.map((s) => (
            <Link key={s.text} to={s.to}
              className={`border rounded-lg p-3 text-sm hover:bg-gray-50 ${s.done ? "border-green-400 bg-green-50" : ""}`}>
              {s.done ? "✓ " : "○ "}{s.text}
            </Link>
          ))}
        </div>
      </div>

   <ReadinessCard readiness={data.readiness} components={data.components} />
      <SkillComparison skills={data.skills} extraSkills={data.extraSkills} />

      {/* Weak areas */}
      <div className="bg-white p-6 rounded-xl shadow grid md:grid-cols-2 gap-6">
        <Chips title="Skill gaps (claimed but weak)" items={data.weakSkills} style="bg-red-100 text-red-800" />
        <Chips title="Missing job skills" items={data.missingJobSkills} style="bg-orange-100 text-orange-800" />
        <Chips title="Weak areas from mock interviews" items={data.interviewWeakAreas} style="bg-yellow-100 text-yellow-800" />
        <Chips title="Recommended topics" items={data.recommendedTopics} style="bg-blue-100 text-blue-800" />
      </div>

      <RoadmapSection roadmap={roadmap} busy={roadmapBusy} error={roadmapError} onGenerate={generateRoadmap} />

      {/* Applications */}
      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Recent applications</h2>
          <Link to="/my-applications" className="text-sm text-blue-600">View all</Link>
        </div>
        {data.applications.length === 0 && <p className="text-sm text-gray-400">No applications yet.</p>}
        {data.applications.map((a) => (
          <div key={a._id} className="flex justify-between items-center border-t pt-2 text-sm">
            <span className="font-medium">{a.jobTitle}</span>
            <span className="text-gray-500">ATS {a.atsScore} • Match {a.matchPercentage}%</span>
            <StatusBadge status={a.status} />
          </div>
        ))}
      </div>
    </div>
  );
}