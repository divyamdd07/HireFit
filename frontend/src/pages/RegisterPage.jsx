import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout, { authInput, authButton } from "../components/AuthLayout";
import GoogleButton, { googleEnabled } from "../components/GoogleButton";
import RecruiterProfileFields from "../components/RecruiterProfileFields";

export default function RegisterPage() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "candidate",
    companyName: "", designation: "", companyWebsite: "", linkedinUrl: "", note: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const isRecruiter = form.role === "recruiter";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate(isRecruiter ? "/recruiter/verification" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credential) => {
    setError("");
    try {
      await googleLogin(credential);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-up failed.");
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start in under a minute"
      footer={<>Have an account? <Link to="/login" className="text-indigo-300 hover:underline">Login</Link></>}
    >
      {/* Role toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/5 p-1">
        {["candidate", "recruiter"].map((r) => (
          <button key={r} type="button" onClick={() => setForm({ ...form, role: r })}
            className={`rounded-lg py-2 text-sm font-medium capitalize transition ${
              form.role === r ? "bg-indigo-500 text-white shadow" : "text-slate-300 hover:text-white"
            }`}>
            {r}
          </button>
        ))}
      </div>

      {googleEnabled && !isRecruiter && (
        <>
          <GoogleButton onCredential={handleGoogle} onError={setError} text="signup_with" />
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="h-px flex-1 bg-white/10" /> OR <div className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}
      {isRecruiter && (
        <p className="text-xs text-slate-400">
          Recruiters register with an official work email so an admin can verify them. Google sign-up is for candidates.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="name" placeholder="Full name" className={authInput} required onChange={handleChange} />
        <input name="email" type="email" className={authInput} required onChange={handleChange}
          placeholder={isRecruiter ? "Official work email" : "Email"} />
        <input name="password" type="password" placeholder="Password (min 6 chars)" className={authInput}
          required onChange={handleChange} />

        {isRecruiter && <RecruiterProfileFields dark form={form} onChange={handleChange} />}

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className={authButton}>{loading ? "Creating..." : "Register"}</button>
      </form>
    </AuthLayout>
  );
}