import { useEffect, useState } from "react";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import SkillList from "../components/SkillList";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/applications/mine")
      .then((res) => setApplications(res.data.applications))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">My Applications</h1>
      {loading && <p>Loading...</p>}
      {!loading && applications.length === 0 && (
        <p className="text-gray-400">You haven't applied to any job yet.</p>
      )}

      {applications.map((app) => (
        <div key={app._id} className="bg-white p-5 rounded-xl shadow space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">{app.job?.title}</h2>
              <p className="text-sm text-gray-500">
                Applied on {new Date(app.createdAt).toLocaleDateString()}
              </p>
            </div>
            <StatusBadge status={app.status} />
          </div>

          <div className="flex gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600">{app.atsScore}</div>
              <div className="text-xs text-gray-500">ATS Score</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{app.matchPercentage}%</div>
              <div className="text-xs text-gray-500">Job Match</div>
            </div>
          </div>

          <SkillList title="Matching skills" skills={app.matchingSkills} color="green" />
          <SkillList title="Missing skills" skills={app.missingSkills} color="red" />

          <div>
            <h3 className="font-semibold mb-1">Suggestions</h3>
            <ul className="list-disc ml-5 text-sm space-y-1">
              {app.resumeData?.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}