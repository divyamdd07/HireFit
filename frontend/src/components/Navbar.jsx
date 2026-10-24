import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center">
      <div className="flex gap-6 items-center">
  <span className="font-bold text-blue-600">HireFit</span>
  <Link to="/" className="text-sm hover:text-blue-600">Dashboard</Link>

  {user.role === "candidate" && (
    <>
      <Link to="/jobs" className="text-sm hover:text-blue-600">Jobs</Link>
      <Link to="/my-applications" className="text-sm hover:text-blue-600">My Applications</Link>
      <Link to="/ats" className="text-sm hover:text-blue-600">ATS Analyzer</Link>
      <Link to="/tests" className="text-sm hover:text-blue-600">Assessments</Link>
      <Link to="/interviews" className="text-sm hover:text-blue-600">Mock Interview</Link>
      <Link to="/my-interviews" className="text-sm hover:text-blue-600">Scheduled Interviews</Link>
    </>
  )}

  {user.role === "recruiter" && (
    <>
      <Link to="/my-jobs" className="text-sm hover:text-blue-600">My Jobs</Link>
      <Link to="/jobs/new" className="text-sm hover:text-blue-600">Post Job</Link>
      <Link to="/assessments" className="text-sm hover:text-blue-600">Assessments</Link>
      <Link to="/recruiter/interviews" className="text-sm hover:text-blue-600">Interviews</Link>
    </>
  )}
  {user.role === "admin" && (
  <>
    <Link to="/admin/users" className="text-sm hover:text-blue-600">Users</Link>
    <Link to="/admin/jobs" className="text-sm hover:text-blue-600">Jobs</Link>
  </>
)}
</div>
      <div className="flex gap-4 items-center text-sm">
        <NotificationBell />
        <span>{user.name} <span className="text-gray-400">({user.role})</span></span>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="text-red-600 hover:underline"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

