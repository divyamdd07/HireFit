import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!stats) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <h1 className="text-3xl font-bold">Admin – {user.name}</h1>

      <h2 className="font-semibold">Users</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Candidates" value={stats.users.candidates} />
        <StatCard label="Recruiters" value={stats.users.recruiters} color="text-purple-600" />
        <StatCard label="Admins" value={stats.users.admins} color="text-gray-700" />
        <StatCard label="New (7 days)" value={stats.users.newThisWeek} color="text-green-600" />
        <StatCard label="Blocked" value={stats.users.blocked} color="text-red-600" />
      </div>

      <h2 className="font-semibold">Platform activity</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Open jobs" value={`${stats.jobs.open}/${stats.jobs.total}`} />
        <StatCard label="Applications" value={stats.applications} color="text-purple-600" />
        <StatCard label="Assessments" value={stats.assessments.total} color="text-orange-600" />
        <StatCard label="Attempts submitted" value={stats.assessments.attemptsSubmitted} color="text-green-600" />
        <StatCard label="Mock interviews" value={stats.mockInterviewsCompleted} color="text-blue-600" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Recent signups</h2>
          <Link to="/admin/users" className="text-sm text-blue-600">Manage users →</Link>
        </div>
        {stats.recentUsers.map((u) => (
          <div key={u._id} className="flex justify-between border-t pt-2 text-sm">
            <span>{u.name} <span className="text-gray-500">({u.email})</span></span>
            <span className="capitalize text-gray-500">
              {u.role} • {new Date(u.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}