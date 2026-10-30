import { authInput } from "./AuthLayout";

const lightInput = "w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function RecruiterProfileFields({ form, onChange, dark = false }) {
  const input = dark ? authInput : lightInput;
  const box = dark ? "border border-white/10 bg-white/5" : "border bg-blue-50";
  const hint = dark ? "text-slate-400" : "text-gray-600";

  return (
    <div className={`space-y-3 rounded-lg p-4 ${box}`}>
      <div>
        <p className="text-sm font-semibold">Recruiter verification details</p>
        <p className={`text-xs ${hint}`}>
          An admin reviews these before you can post jobs. Use your official work email above.
        </p>
      </div>
      <input name="companyName" placeholder="Company name" className={input} required
        value={form.companyName} onChange={onChange} />
      <input name="designation" placeholder="Your designation (e.g. HR Manager)" className={input} required
        value={form.designation} onChange={onChange} />
      <input name="companyWebsite" placeholder="Company website (e.g. https://acme.com)" className={input}
        value={form.companyWebsite} onChange={onChange} />
      <input name="linkedinUrl" className={input} value={form.linkedinUrl} onChange={onChange}
        placeholder="LinkedIn profile URL (required for personal email or no website)" />
      <textarea name="note" rows="2" className={input} value={form.note} onChange={onChange}
        placeholder="Anything that helps us verify you (optional)" />
    </div>
  );
}