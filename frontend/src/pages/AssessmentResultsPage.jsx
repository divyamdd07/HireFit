import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import CompareChart from "../components/CompareChart";

const STATUSES = ["applied", "screening", "assessment", "shortlisted", "interview", "selected", "rejected"];
const MAX_COMPARE = 3;

export default function AssessmentResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]); // attemptId list
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    api.get(`/assessments/${id}/results`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load results."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!data) return <p className="p-6 text-red-600">{error}</p>;

  const { assessment, stats, rows } = data;

  const toggleSelect = (attemptId) => {
    setComparing(false);
    if (selected.includes(attemptId)) {
      setSelected(selected.filter((x) => x !== attemptId));
    } else if (selected.length < MAX_COMPARE) {
      setSelected([...selected, attemptId]);
    }
  };

  const changeStatus = async (row, status) => {
    try {
      await api.patch(`/applications/${row.application._id}/status`, { status });
      setData({
        ...data,
        rows: rows.map((r) =>
          r.attemptId === row.attemptId ? { ...r, application: { ...r.application, status } } : r
        ),
      });
    } catch (err) {
      setError(err.response?.data?.message || "Could not change status.");
    }
  };

  const selectedRows = rows.filter((r) => selected.includes(r.attemptId));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-5">
      <Link to={`/assessments/${id}`} className="text-sm text-blue-600">← Back to assessment</Link>
      <div>
        <h1 className="text-3xl font-bold">{assessment.title} – Results</h1>
        <p className="text-gray-500 text-sm">{assessment.job?.title}</p>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Started", stats.started],
          ["Submitted", stats.submitted],
          ["Average", `${stats.averagePercentage}%`],
          ["Highest", `${stats.highestPercentage}%`],
        ].map(([label, value]) => (
          <div key={label} className="bg-white p-4 rounded-xl shadow text-center">
            <div className="text-3xl font-bold text-blue-600">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Compare bar */}
      <div className="flex items-center gap-3">
        <button
          disabled={selected.length < 2}
          onClick={() => setComparing(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40"
        >
          Compare selected ({selected.length})
        </button>
        <span className="text-sm text-gray-500">Select 2 to {MAX_COMPARE} submitted candidates.</span>
      </div>

      {comparing && selectedRows.length >= 2 && (
        <CompareChart rows={selectedRows} onClose={() => setComparing(false)} />
      )}

      {rows.length === 0 && <p className="text-gray-400">No candidate has started this assessment yet.</p>}

      {rows.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3"></th>
                <th className="p-3">#</th>
                <th className="p-3">Candidate</th>
                <th className="p-3">Assessment</th>
                <th className="p-3">Time</th>
                <th className="p-3">ATS</th>
                <th className="p-3">Match</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const submitted = r.status === "submitted";
                return (
                  <tr key={r.attemptId} className="border-t">
                    <td className="p-3">
                      <input type="checkbox" disabled={!submitted}
                        checked={selected.includes(r.attemptId)}
                        onChange={() => toggleSelect(r.attemptId)} />
                    </td>
                    <td className="p-3">{i + 1}</td>
                    <td className="p-3">
                      <div className="font-medium">{r.candidate.name}</div>
                      <div className="text-gray-500">{r.candidate.email}</div>
                    </td>
                    <td className="p-3">
                      {submitted ? (
                        <>
                          <span className="font-bold text-blue-600">{r.percentage}%</span>
                          <span className="text-gray-500"> ({r.totalScore}/{r.maxScore})</span>
                        </>
                      ) : (
                        <span className="text-yellow-700">In progress</span>
                      )}
                    </td>
                    <td className="p-3">{r.minutesTaken !== null ? `${r.minutesTaken} min` : "-"}</td>
                    <td className="p-3">{r.application?.atsScore ?? "-"}</td>
                    <td className="p-3">{r.application ? `${r.application.matchPercentage}%` : "-"}</td>
                    <td className="p-3">
                      {r.application && (
                        <select value={r.application.status}
                          onChange={(e) => changeStatus(r, e.target.value)}
                          className="border rounded p-1 capitalize">
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="p-3">
                      <Link to={`/assessments/${id}/results/${r.attemptId}`}
                        className="text-blue-600 hover:underline">Details</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}