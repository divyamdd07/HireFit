import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";

const TABS = [
  ["pending", "Pending"], ["verified", "Verified"], ["rejected", "Rejected"],
  ["suspended", "Suspended"], ["none", "Incomplete"], ["audit", "Audit log"],
];

const Chip = ({ ok, label, neutral }) => (
  <span className={`px-2 py-1 rounded-full text-xs ${
    neutral ? "bg-gray-100 text-gray-600" : ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
  }`}>{label}</span>
);

function ReviewPanel({ id, onChanged }) {
  const [data, setData] = useState(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/admin/recruiters/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load details."));
  }, [id]);
  useEffect(load, [load]);

  if (!data) return <p className="p-4 text-sm">{error || "Loading..."}</p>;
  const { recruiter: r, duplicates, jobCount, history } = data;
  const p = r.recruiterProfile || {};
  const s = r.signals;
  const status = r.verificationStatus || "none";

  const decide = async (action) => {
    if (!window.confirm(`Do you want to ${action} ${r.name}?`)) return;
    setBusy(true);
    setError("");
    try {
      await api.patch(`/admin/recruiters/${id}/decision`, { action, reason });
      setReason("");
      load();
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-gray-50 border-t p-4 space-y-3 text-sm">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <p><b>{r.name}</b> • {r.email}</p>
          <p>{p.designation} at <b>{p.companyName}</b></p>
          {p.companyWebsite && (
            <p>Website: <a href={p.companyWebsite} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 break-all">{p.companyWebsite}</a></p>
          )}
          {p.linkedinUrl && (
            <p>LinkedIn: <a href={p.linkedinUrl} target="_blank" rel="noopener noreferrer"
              className="text-blue-600 break-all">{p.linkedinUrl}</a></p>
          )}
          {p.note && <p className="text-gray-600">Note: {p.note}</p>}
          <p className="text-gray-500">Jobs posted: {jobCount}</p>
        </div>
        <div className="flex flex-wrap gap-2 content-start">
          <Chip ok={s.emailVerified} label={s.emailVerified ? "Email verified" : "Email NOT verified"} />
          <Chip ok={!s.freeEmail} label={s.freeEmail ? `Personal email (${s.emailDomain})` : `Work email (${s.emailDomain})`} />
          {s.domainMatch !== null && <Chip ok={s.domainMatch} label={s.domainMatch ? "Email matches website" : "Email does NOT match website"} />}
          {!s.hasWebsite && <Chip neutral label="No website" />}
          <Chip ok={s.domainVerified} neutral={!s.domainVerified} label={s.domainVerified ? "DNS verified" : "DNS not verified"} />
          <Chip ok={s.hasLinkedin} neutral={!s.hasLinkedin} label={s.hasLinkedin ? "LinkedIn given" : "No LinkedIn"} />
        </div>
      </div>

      {r.verificationReason && <p className="text-red-700">Last reason: {r.verificationReason}</p>}

      {duplicates.length > 0 && (
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="font-semibold">Other recruiters with the same company/domain</p>
          {duplicates.map((d) => (
            <p key={d._id}>{d.name} ({d.email}) • {d.recruiterProfile?.companyName} • <b>{d.verificationStatus}</b></p>
          ))}
        </div>
      )}

      {error && <p className="text-red-600">{error}</p>}

      <textarea rows="2" value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (required for reject / suspend, shown to the recruiter)"
        className="w-full border rounded-lg p-2" />
      <div className="flex flex-wrap gap-3">
        {["pending", "rejected"].includes(status) && (
          <button disabled={busy || !s.emailVerified} onClick={() => decide("approve")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-40">Approve</button>
        )}
        {status === "pending" && (
          <button disabled={busy} onClick={() => decide("reject")}
            className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-40">Reject</button>
        )}
        {status === "verified" && (
          <button disabled={busy} onClick={() => decide("suspend")}
            className="bg-red-600 text-white px-4 py-2 rounded-lg disabled:opacity-40">Suspend (closes open jobs)</button>
        )}
        {status === "suspended" && (
          <button disabled={busy || !s.emailVerified} onClick={() => decide("reinstate")}
            className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-40">Reinstate</button>
        )}
      </div>
      {!s.emailVerified && <p className="text-xs text-gray-500">Approval is disabled until the email is verified.</p>}

      {history.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          <p className="font-semibold">History</p>
          {history.map((h) => (
            <p key={h._id}>{new Date(h.createdAt).toLocaleString()} • {h.action} by {h.actor?.name} {h.details?.reason && `• ${h.details.reason}`}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminRecruitersPage() {
  const [tab, setTab] = useState("pending");
  const [list, setList] = useState([]);
  const [counts, setCounts] = useState({});
  const [logs, setLogs] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const request = tab === "audit" ? api.get("/admin/audit-logs") : api.get("/admin/recruiters", { params: { status: tab } });
    request
      .then((res) => {
        if (tab === "audit") return setLogs(res.data.logs);
        setList(res.data.recruiters);
        setCounts(res.data.counts);
      })
      .catch((err) => setError(err.response?.data?.message || "Could not load data."))
      .finally(() => setLoading(false));
  }, [tab]);
  useEffect(load, [load]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Recruiter verification</h1>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setOpenId(null); }}
            className={`px-4 py-2 rounded-lg border text-sm ${tab === key ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}>
            {label}{key !== "audit" && counts[key] !== undefined && ` (${counts[key]})`}
          </button>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {loading && <p>Loading...</p>}

      {tab !== "audit" && !loading && list.length === 0 && <p className="text-gray-400">Nothing here.</p>}
      {tab !== "audit" && list.map((r) => (
        <div key={r._id} className="bg-white rounded-xl shadow overflow-hidden">
          <div className="p-4 flex flex-wrap justify-between items-center gap-2">
            <div>
              <div className="font-semibold">{r.name} <span className="text-gray-500 font-normal">({r.email})</span></div>
              <div className="text-sm text-gray-500">
                {r.recruiterProfile?.companyName || "No company"} • {r.recruiterProfile?.designation || "-"}
                {!r.emailVerified && <span className="ml-2 text-orange-600">email not verified</span>}
              </div>
            </div>
            <button onClick={() => setOpenId(openId === r._id ? null : r._id)} className="text-blue-600 hover:underline text-sm">
              {openId === r._id ? "Close" : "Review"}
            </button>
          </div>
          {openId === r._id && <ReviewPanel id={r._id} onChanged={load} />}
        </div>
      ))}

      {tab === "audit" && !loading && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr><th className="p-3">When</th><th className="p-3">By</th><th className="p-3">Action</th><th className="p-3">Target</th><th className="p-3">Details</th></tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id} className="border-t align-top">
                  <td className="p-3">{new Date(l.createdAt).toLocaleString()}</td>
                  <td className="p-3">{l.actor?.name}</td>
                  <td className="p-3 font-mono text-xs">{l.action}</td>
                  <td className="p-3">{l.target?.name}</td>
                  <td className="p-3 text-xs text-gray-600">{JSON.stringify(l.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}