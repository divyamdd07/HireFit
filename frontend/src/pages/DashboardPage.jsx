import { useAuth } from "../context/AuthContext";
import CandidateDashboard from "./CandidateDashboard";
import RecruiterDashboard from "./RecruiterDashboard";
import AdminDashboard from "./AdminDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user.role === "recruiter") return <RecruiterDashboard />;
  if (user.role === "admin") return <AdminDashboard />;
  return <CandidateDashboard />;
}