import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isVerifiedRecruiter } from "../utils/recruiter";

// allowUnverified: sirf verification page ke liye
export default function ProtectedRoute({ children, roles, allowUnverified = false }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  // Unverified recruiter har protected page (dashboard bhi) se status page par jata hai.
  // Ye sirf UX hai. Asli security backend middleware hai
  if (user.role === "recruiter" && !allowUnverified && !isVerifiedRecruiter(user)) {
    return <Navigate to="/recruiter/verification" replace />;
  }

  return children;
}