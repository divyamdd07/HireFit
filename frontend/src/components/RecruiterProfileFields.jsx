const inputClass = "w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function RecruiterProfileFields({ form, onChange }) {
  return (
    <div className="space-y-3 border rounded-lg p-4 bg-blue-50">
      <div>
        <p className="text-sm font-semibold">Recruiter verification details</p>
        <p className="text-xs text-gray-600">
          An admin reviews these before you can post jobs. Use your official work email above.
        </p>
      </div>
      <input name="companyName" placeholder="Company name" className={inputClass} required
        value={form.companyName} onChange={onChange} />
      <input name="designation" placeholder="Your designation (e.g. HR Manager)" className={inputClass} required
        value={form.designation} onChange={onChange} />
      <input name="companyWebsite" placeholder="Company website (e.g. https://acme.com)" className={inputClass}
        value={form.companyWebsite} onChange={onChange} />
      <input name="linkedinUrl" className={inputClass} value={form.linkedinUrl} onChange={onChange}
        placeholder="LinkedIn profile URL (required for personal email or no website)" />
      <textarea name="note" rows="2" className={inputClass} value={form.note} onChange={onChange}
        placeholder="Anything that helps us verify you (optional)" />
    </div>
  );
}