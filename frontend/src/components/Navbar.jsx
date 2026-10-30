import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isVerifiedRecruiter } from "../utils/recruiter";
import NotificationBell from "./NotificationBell";

const CANDIDATE_LINKS = [
  ["/", "Dashboard"],
  ["/jobs", "Jobs"],
  ["/my-applications", "Applications"],
  ["/ats", "ATS"],
  ["/tests", "Assessments"],
  ["/interviews", "Mock Interview"],
  ["/my-interviews", "Interviews"],
];
const RECRUITER_LINKS = [
  ["/", "Dashboard"],
  ["/my-jobs", "My Jobs"],
  ["/jobs/new", "Post Job"],
  ["/assessments", "Assessments"],
  ["/recruiter/interviews", "Interviews"],
];
const ADMIN_LINKS = [
  ["/", "Dashboard"],
  ["/admin/users", "Users"],
  ["/admin/jobs", "Jobs"],
  ["/admin/recruiters", "Recruiters"],
];

function linksFor(user) {
  if (user.role === "candidate") return CANDIDATE_LINKS;
  if (user.role === "admin") return ADMIN_LINKS;
  if (isVerifiedRecruiter(user)) return RECRUITER_LINKS;
  const status = user.verificationStatus === "none" ? "incomplete" : user.verificationStatus;
  return [["/recruiter/verification", `Verification (${status})`]];
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const links = linksFor(user);
  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm transition ${
      isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold bg-linear-to-r from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
          HireFit
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 lg:flex">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={linkClass}>{label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 text-white">
          <NotificationBell />
          <span className="hidden text-sm text-slate-300 xl:block">
            {user.name} <span className="text-slate-500">({user.role})</span>
          </span>
          <button onClick={handleLogout} className="hidden rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-white/5 lg:block">
            Logout
          </button>
          <button onClick={() => setOpen(!open)} aria-label="Menu" className="rounded-lg px-2 py-1 text-xl lg:hidden">
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 lg:hidden">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"} className={linkClass} onClick={() => setOpen(false)}>
              {label}
            </NavLink>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
            <span className="text-slate-300">{user.name} <span className="text-slate-500">({user.role})</span></span>
            <button onClick={handleLogout} className="text-red-300">Logout</button>
          </div>
        </nav>
      )}
    </header>
  );
}