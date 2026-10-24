import { useEffect, useState } from "react";
import api from "../api/axios";

const STATUS_STYLE = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function MyScheduledInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/recruiter-interviews/schedule")
      .then((res) => setInterviews(res.data.interviews))
      .catch((err) => setError(err.response?.data?.message || "Could not load interviews."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Scheduled Interviews</h1>
      <p className="text-sm text-gray-500">Interviews scheduled by recruiters. For practice, use Mock Interview.</p>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && interviews.length === 0 && <p className="text-gray-400">No interviews scheduled yet.</p>}

      {interviews.map((i) => (
        <div key={i._id} className="bg-white p-5 rounded-xl shadow space-y-1">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-semibold text-lg">{i.job?.title}</h2>
              <p className="text-sm text-gray-500">with {i.recruiter?.name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs capitalize ${STATUS_STYLE[i.status]}`}>{i.status}</span>
          </div>
          <p className="text-sm">
            {new Date(i.scheduledAt).toLocaleString()} • {i.durationMinutes} min • {i.mode}
          </p>
          {i.meetingLink && (
            <p className="text-sm text-blue-600 break-all">
              {i.meetingLink.startsWith("http") ? (
                <a href={i.meetingLink} target="_blank" rel="noreferrer">{i.meetingLink}</a>
              ) : i.meetingLink}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}