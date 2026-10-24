import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/dashboard/recruiter")
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load dashboard."),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!data) return <p className="p-6 text-red-600">{error}</p>;

  const {
    stats,
    pipeline,
    jobs,
    topCandidates,
    assessments,
    upcomingInterviews,
  } = data;
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
        <Link
          to="/jobs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Post job
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Active jobs" value={stats.activeJobs} />
        <StatCard
          label="Total applicants"
          value={stats.totalApplicants}
          color="text-purple-600"
        />
        <StatCard
          label="Shortlisted"
          value={stats.shortlisted}
          color="text-green-600"
        />
        <StatCard
          label="Average ATS"
          value={stats.averageAts}
          color="text-orange-600"
        />
        <StatCard
          label="All jobs"
          value={stats.totalJobs}
          color="text-gray-700"
        />
      </div>

      {/* Pipeline */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-semibold mb-3">Hiring pipeline</h2>
        {stats.totalApplicants === 0 ? (
          <p className="text-sm text-gray-400">No applicants yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pipeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top candidates */}
      <div className="bg-white p-6 rounded-xl shadow space-y-2">
        <h2 className="font-semibold">Top candidates (by ATS score)</h2>
        {topCandidates.length === 0 && (
          <p className="text-sm text-gray-400">No candidates yet.</p>
        )}
        {topCandidates.map((c) => (
          <div
            key={c.applicationId}
            className="flex flex-wrap justify-between items-center gap-2 border-t pt-2 text-sm"
          >
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-gray-500">{c.jobTitle}</div>
            </div>
            <span>
              ATS <b className="text-blue-600">{c.atsScore}</b> • Match{" "}
              {c.matchPercentage}%
            </span>
            <StatusBadge status={c.status} />
            <Link
              to={`/jobs/${c.jobId}/applicants`}
              className="text-blue-600 hover:underline"
            >
              Open
            </Link>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Upcoming interviews</h2>
          <Link to="/recruiter/interviews" className="text-sm text-blue-600">
            View all
          </Link>
        </div>
        {upcomingInterviews.length === 0 && (
          <p className="text-sm text-gray-400">No upcoming interviews.</p>
        )}
        {upcomingInterviews.map((i) => (
          <div
            key={i._id}
            className="flex flex-wrap justify-between items-center gap-2 border-t pt-2 text-sm"
          >
            <div>
              <div className="font-medium">{i.candidate?.name}</div>
              <div className="text-gray-500">{i.job?.title}</div>
            </div>
            <span>{new Date(i.scheduledAt).toLocaleString()}</span>
            <Link
              to={`/recruiter/interviews/${i._id}`}
              className="text-blue-600 hover:underline"
            >
              Open
            </Link>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Jobs */}
        <div className="bg-white p-6 rounded-xl shadow space-y-2">
          <h2 className="font-semibold">Your jobs</h2>
          {jobs.length === 0 && (
            <p className="text-sm text-gray-400">No jobs posted yet.</p>
          )}
          {jobs.map((job) => (
            <div
              key={job._id}
              className="flex justify-between items-center border-t pt-2 text-sm"
            >
              <div>
                <div className="font-medium">{job.title}</div>
                <div className="text-gray-500 capitalize">
                  {job.status} • avg ATS {job.averageAts}
                </div>
              </div>
              <Link
                to={`/jobs/${job._id}/applicants`}
                className="text-blue-600 hover:underline"
              >
                {job.applicants} applicants
              </Link>
            </div>
          ))}
        </div>

        {/* Assessments */}
        <div className="bg-white p-6 rounded-xl shadow space-y-2">
          <h2 className="font-semibold">Assessment analytics</h2>
          {assessments.length === 0 && (
            <p className="text-sm text-gray-400">No assessments yet.</p>
          )}
          {assessments.map((a) => (
            <div
              key={a._id}
              className="flex justify-between items-center border-t pt-2 text-sm"
            >
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-gray-500 capitalize">
                  {a.status} • {a.submitted}/{a.started} submitted • avg{" "}
                  {a.averagePercentage}%
                </div>
              </div>
              <Link
                to={`/assessments/${a._id}/results`}
                className="text-blue-600 hover:underline"
              >
                Results
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
