import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const inputClass = "w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function ScheduleInterviewPage() {
  const { applicationId } = useParams();
  const { state } = useLocation(); // ApplicantsPage se naam aata hai (optional)
  const navigate = useNavigate();
  const [form, setForm] = useState({ scheduledAt: "", durationMinutes: 45, mode: "online", meetingLink: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await api.post("/recruiter-interviews", {
        ...form,
        applicationId,
        // datetime-local browser ke local time mein hota hai, ISO mein badal ke bhejo
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      navigate(`/recruiter/interviews/${res.data.interview._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not schedule the interview.");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Schedule interview</h1>
      {state?.name && (
        <p className="text-gray-500">{state.name} • {state.jobTitle}</p>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-3">
        <label className="block text-sm">
          Date and time
          <input type="datetime-local" name="scheduledAt" required className={`${inputClass} mt-1`}
            onChange={handleChange} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Duration (minutes)
            <input type="number" name="durationMinutes" min="15" max="180" value={form.durationMinutes}
              className={`${inputClass} mt-1`} onChange={handleChange} />
          </label>
          <label className="block text-sm">
            Mode
            <select name="mode" value={form.mode} className={`${inputClass} mt-1`} onChange={handleChange}>
              <option value="online">Online</option>
              <option value="onsite">On-site</option>
            </select>
          </label>
        </div>
        <input name="meetingLink" className={inputClass} onChange={handleChange}
          placeholder={form.mode === "online" ? "Meeting link (Google Meet, Zoom...)" : "Address"} />

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={saving}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Scheduling..." : "Schedule"}
        </button>
      </form>
    </div>
  );
}