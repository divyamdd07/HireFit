import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout, { authInput, authButton } from "../components/AuthLayout";
import GoogleButton, { googleEnabled } from "../components/GoogleButton";

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
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
      setError(err.response?.data?.message || "Google sign-in failed.");
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue"
      footer={<>No account? <Link to="/register" className="text-indigo-300 hover:underline">Register</Link></>}
    >
      {googleEnabled && (
        <>
          <GoogleButton onCredential={handleGoogle} onError={setError} text="continue_with" />
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="h-px flex-1 bg-white/10" /> OR <div className="h-px flex-1 bg-white/10" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="email" placeholder="Email" className={authInput} required
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password" className={authInput} required
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button disabled={loading} className={authButton}>{loading ? "Logging in..." : "Login"}</button>
      </form>
    </AuthLayout>
  );
}