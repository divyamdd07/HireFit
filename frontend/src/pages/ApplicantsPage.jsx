import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios";

const STATUSES = [
  "applied",
  "screening",
  "assessment",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
];

export default function ApplicantsPage() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // ⭐ ADDED: ATS score filter state
  const [atsFilter, setAtsFilter] = useState("");

  useEffect(() => {
    setLoading(true);

    api
      .get(`/applications/job/${jobId}`, {
        params: {
          status: filter || undefined,
        },
      })
      .then((res) => {
        setJob(res.data.job);
        setApplications(res.data.applications);
      })
      .finally(() => setLoading(false));
  }, [jobId, filter]);

  const changeStatus = async (id, status) => {
    await api.patch(`/applications/${id}/status`, { status });

    setApplications(
      applications.map((a) => (a._id === id ? { ...a, status } : a)),
    );
  };

  // Resume ko token ke saath fetch karke naye tab mein kholo
  const openResume = async (id) => {
    const res = await api.get(`/applications/${id}/resume`, {
      responseType: "blob",
    });

    const url = URL.createObjectURL(res.data);
    window.open(url, "_blank");
  };

  // ⭐ ADDED: ATS score ke according applications filter karna
  const filteredApplications = applications.filter((application) => {
    if (!atsFilter) return true;

    return application.atsScore >= Number(atsFilter);
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">
        Applicants {job && `– ${job.title}`}
      </h1>

      {/* ⭐ ADDED: Filters container */}
      <div className="flex gap-3 flex-wrap">
        {/* Existing status filter */}
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded-lg p-2 capitalize"
        >
          <option value="">All statuses</option>

          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* ⭐ ADDED: ATS score filter */}
        <select
          value={atsFilter}
          onChange={(e) => setAtsFilter(e.target.value)}
          className="border rounded-lg p-2"
        >
          <option value="">All ATS scores</option>
          <option value="70">70+</option>
          <option value="80">80+</option>
          <option value="90">90+</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && filteredApplications.length === 0 && (
        <p className="text-gray-400">No applicants found.</p>
      )}

      {/* ⭐ CHANGED:
          applications.length → filteredApplications.length
      */}
      {filteredApplications.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Candidate</th>
                <th className="p-3">ATS</th>
                <th className="p-3">Match</th>
                <th className="p-3">Missing skills</th>
                <th className="p-3">Resume</th>
                <th className="p-3">Status</th>
                <th className="p-3">Interview</th>
              </tr>
            </thead>

            <tbody>
              {/* ⭐ CHANGED:
                  applications.map → filteredApplications.map
              */}
              {filteredApplications.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{a.candidate?.name}</div>

                    <div className="text-gray-500">{a.candidate?.email}</div>
                  </td>

                  <td className="p-3 font-bold text-blue-600">{a.atsScore}</td>

                  <td className="p-3">{a.matchPercentage}%</td>

                  <td className="p-3 text-red-600">
                    {a.missingSkills.join(", ") || "-"}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => openResume(a._id)}
                      className="text-blue-600 hover:underline"
                    >
                      View PDF
                    </button>
                  </td>

                  <td className="p-3">
                    <select
                      value={a.status}
                      onChange={(e) => changeStatus(a._id, e.target.value)}
                      className="border rounded p-1 capitalize"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="p-3">
                    <Link
                      to={`/recruiter/interviews/new/${a._id}`}
                      state={{ name: a.candidate?.name, jobTitle: job?.title }}
                      className="text-blue-600 hover:underline"
                    >
                      Schedule
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
