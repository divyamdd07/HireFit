import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import RecruiterProfileFields from "../components/RecruiterProfileFields";

const STATUS_INFO = {
  none: { label: "Details needed", style: "bg-gray-100 text-gray-700", text: "Submit your company details so an admin can verify you." },
  pending: { label: "Pending review", style: "bg-yellow-100 text-yellow-800", text: "An admin is reviewing your request. You will get an email and a notification when it is decided." },
  verified: { label: "Verified", style: "bg-green-100 text-green-700", text: "Your recruiter account is verified. You can post jobs." },
  rejected: { label: "Rejected", style: "bg-red-100 text-red-700", text: "Your request was rejected. Fix the issue below and submit again." },
  suspended: { label: "Suspended", style: "bg-red-100 text-red-700", text: "Your account is suspended and your open jobs were closed. Contact the platform admin." },
};

export default function RecruiterVerificationPage() {
  const { refreshUser } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const apply = (d) => {
    setData(d);
    setForm({ ...d.profile });
  };

  const load = async () => {
    const res = await api.get("/recruiter-verification/me");
    apply(res.data);
    await refreshUser().catch(() => {}); // navbar/route guard ko naya status mil jaye
  };

  useEffect(() => {
    load()
      .catch((err) => setError(err.response?.data?.message || "Could not load your status."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (name, work) => {
    setBusy(name);
    setError("");
    setMessage("");
    try {
      await work();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setBusy("");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!data) return <p className="p-6 text-red-600">{error}</p>;

  const status = data.verificationStatus;
  const info = STATUS_INFO[status];
  const canEdit = ["none", "pending", "rejected"].includes(status);

  const resend = () =>
    run("resend", async () => {
      const res = await api.post("/auth/resend-verification");
      setMessage(res.data.message);
    });

  const submit = (e) => {
    e.preventDefault();
    run("submit", async () => {
      const res = await api.post("/recruiter-verification/resubmit", form);
      apply(res.data);
      await refreshUser().catch(() => {});
      setMessage("Details submitted for review.");
    });
  };

  const checkDns = () =>
    run("dns", async () => {
      const res = await api.post("/recruiter-verification/check-domain");
      apply(res.data);
      setMessage("Domain ownership verified.");
    });

  const refresh = () => run("refresh", load);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      <h1 className="text-3xl font-bold">Recruiter verification</h1>

      <div className="bg-white p-5 rounded-xl shadow space-y-2">
        <span className={`px-3 py-1 rounded-full text-sm ${info.style}`}>{info.label}</span>
        <p className="text-sm text-gray-700">{info.text}</p>
        {data.verificationReason && (
          <p className="text-sm bg-red-50 text-red-700 p-3 rounded-lg">Reason: {data.verificationReason}</p>
        )}
        <div className="flex gap-4 text-sm pt-1">
          <button onClick={refresh} disabled={Boolean(busy)} className="text-blue-600 hover:underline">
            {busy === "refresh" ? "Checking..." : "Refresh status"}
          </button>
          {status === "verified" && <Link to="/" className="text-blue-600 hover:underline">Go to dashboard</Link>}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {message && <p className="text-green-700 text-sm">{message}</p>}

      <div className="bg-white p-5 rounded-xl shadow space-y-2">
        <h2 className="font-semibold">Step 1: Verify your work email</h2>
        {data.emailVerified ? (
          <p className="text-sm text-green-700">✓ Email verified.</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">We sent a link to your email. It is valid for 24 hours.</p>
            <button onClick={resend} disabled={Boolean(busy)}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
              {busy === "resend" ? "Sending..." : "Resend email"}
            </button>
          </>
        )}
        <p className="text-xs text-gray-500">
          Email verification only proves you own the inbox. Admin approval is what makes you a verified recruiter.
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl shadow space-y-3">
        <h2 className="font-semibold">Step 2: Company details</h2>
        {canEdit ? (
          <form onSubmit={submit} className="space-y-3">
            <RecruiterProfileFields form={form} onChange={(e) => setForm({ ...form, [e.target.name]: e.target.value })} />
            <button disabled={Boolean(busy)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {busy === "submit" ? "Submitting..." : status === "pending" ? "Update details" : "Submit for review"}
            </button>
          </form>
        ) : (
          <div className="text-sm space-y-1">
            <p><b>{data.profile.companyName}</b> • {data.profile.designation}</p>
            {data.profile.companyWebsite && <p>{data.profile.companyWebsite}</p>}
          </div>
        )}
      </div>

      {data.dnsRecord && (
        <div className="bg-white p-5 rounded-xl shadow space-y-2">
          <h2 className="font-semibold">Optional: prove you control {data.profile.companyDomain}</h2>
          {data.profile.domainVerified ? (
            <p className="text-sm text-green-700">✓ Domain ownership verified. Admins will see this.</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Ask whoever manages your DNS to add this TXT record, then click Check. It makes approval faster.
              </p>
              <div className="text-xs font-mono bg-gray-100 p-3 rounded-lg space-y-1 break-all">
                <div>Type: {data.dnsRecord.type}</div>
                <div>Host: {data.dnsRecord.host}</div>
                <div>Value: {data.dnsRecord.value}</div>
              </div>
              <button onClick={checkDns} disabled={Boolean(busy)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
                {busy === "dns" ? "Checking DNS..." : "Check DNS"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}