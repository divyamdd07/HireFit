import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "candidate" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Create account</h1>
        <input name="name" placeholder="Full name" className={inputClass} required onChange={handleChange} />
        <input name="email" type="email" placeholder="Email" className={inputClass} required onChange={handleChange} />
        <input name="password" type="password" placeholder="Password (min 6 chars)" className={inputClass}
          required onChange={handleChange} />
        <select name="role" className={inputClass} onChange={handleChange}>
          <option value="candidate">I'm a Candidate</option>
          <option value="recruiter">I'm a Recruiter</option>
        </select>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Creating..." : "Register"}
        </button>
        <p className="text-sm text-center">
          Have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </form>
    </div>
  );
}