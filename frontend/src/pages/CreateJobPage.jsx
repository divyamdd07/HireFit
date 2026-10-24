import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function CreateJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "", description: "", requiredSkills: "", preferredSkills: "",
    minExperience: 0, education: "", location: "", employmentType: "full-time",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/jobs", form);
      navigate("/my-jobs");
    } catch (err) {
      setError(err.response?.data?.message || "Could not create job.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Create Job</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
        <input name="title" placeholder="Job title" className={inputClass} required onChange={handleChange} />
        <textarea name="description" rows="5" placeholder="Job description" className={inputClass}
          required onChange={handleChange} />
        <input name="requiredSkills" placeholder="Required skills (comma separated)"
          className={inputClass} onChange={handleChange} />
        <input name="preferredSkills" placeholder="Preferred skills (comma separated)"
          className={inputClass} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-4">
          <input name="minExperience" type="number" min="0" placeholder="Min experience (years)"
            className={inputClass} onChange={handleChange} />
          <input name="location" placeholder="Location" className={inputClass} onChange={handleChange} />
        </div>
        <input name="education" placeholder="Education requirement" className={inputClass} onChange={handleChange} />
        <select name="employmentType" className={inputClass} onChange={handleChange}>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="contract">Contract</option>
        </select>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Creating..." : "Create Job"}
        </button>
      </form>
    </div>
  );
}