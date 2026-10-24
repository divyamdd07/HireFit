import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const STATUS_STYLE = {
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
};

function Row({ interview }) {
  return (
    <Link to={`/recruiter/interviews/${interview._id}`}
      className="bg-white p-4 rounded-xl shadow flex flex-wrap justify-between items-center gap-3 hover:bg-gray-50">
      <div>
        <div className="font-semibold">{interview.candidate?.name}</div>
        <div className="text-sm text-gray-500">{interview.job?.title}</div>
      </div>
      <div className="text-sm text-gray-600">
        {new Date(interview.scheduledAt).toLocaleString()} • {interview.durationMinutes} min • {interview.mode}
      </div>
      <span className={`px-3 py-1 rounded-full text-xs capitalize ${STATUS_STYLE[interview.status]}`}>
        {interview.status}
      </span>
    </Link>
  );
}

export default function RecruiterInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/recruiter-interviews/mine")
      .then((res) => setInterviews(res.data.interviews))
      .catch((err) => setError(err.response?.data?.message || "Could not load interviews."))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = interviews.filter((i) => i.status === "scheduled");
  const past = interviews.filter((i) => i.status !== "scheduled").reverse();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Interviews</h1>
      <p className="text-sm text-gray-500">
        To schedule one, open a job's applicants and click "Schedule interview".
      </p>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && interviews.length === 0 && <p className="text-gray-400">No interviews yet.</p>}

      {upcoming.length > 0 && <h2 className="text-xl font-semibold">Upcoming</h2>}
      {upcoming.map((i) => <Row key={i._id} interview={i} />)}

      {past.length > 0 && <h2 className="text-xl font-semibold pt-2">Past</h2>}
      {past.map((i) => <Row key={i._id} interview={i} />)}
    </div>
  );
}