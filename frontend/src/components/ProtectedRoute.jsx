import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// roles is optional: <ProtectedRoute roles={["recruiter"]}>
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}