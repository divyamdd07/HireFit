import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [state, setState] = useState({ status: "loading", message: "" });
  const called = useRef(false); // token single-use hai, StrictMode mein do baar call nahi hona chahiye

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = params.get("token");
    if (!token) return setState({ status: "error", message: "Verification link is missing a token." });

    api.post("/auth/verify-email", { token })
      .then(async () => {
        if (user) await refreshUser().catch(() => {});
        setState({ status: "ok", message: "Your email is verified." });
      })
      .catch((err) =>
        setState({ status: "error", message: err.response?.data?.message || "Could not verify the email." })
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 mt-10 bg-white rounded-xl shadow space-y-3 text-center">
      <h1 className="text-2xl font-bold">Email verification</h1>
      {state.status === "loading" && <p>Verifying...</p>}
      {state.status === "ok" && <p className="text-green-700">{state.message}</p>}
      {state.status === "error" && <p className="text-red-600">{state.message}</p>}
      <Link to={user ? "/recruiter/verification" : "/login"} className="text-blue-600 text-sm">
        {user ? "Go to verification status" : "Go to login"}
      </Link>
    </div>
  );
}