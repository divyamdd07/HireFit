const VERDICTS = {
  verified: { label: "Verified", style: "bg-green-100 text-green-700" },
  partial: { label: "Partial", style: "bg-yellow-100 text-yellow-700" },
  gap: { label: "Skill gap", style: "bg-red-100 text-red-700" },
  unverified: { label: "Not tested", style: "bg-gray-100 text-gray-600" },
};

const show = (value) => (value === null ? "-" : `${value}%`);

export default function SkillComparison({ skills, extraSkills }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow space-y-4">
      <div>
        <h2 className="font-semibold">Claimed vs demonstrated skills</h2>
        <p className="text-xs text-gray-500">
          Skills from your resume compared with your assessment and mock interview performance.
        </p>
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-gray-400">Apply to a job with your resume to see this.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Skill (on resume)</th>
                <th className="p-2">Assessment</th>
                <th className="p-2">Interview</th>
                <th className="p-2">Demonstrated</th>
                <th className="p-2">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((s) => (
                <tr key={s.name} className="border-t">
                  <td className="p-2 font-medium">{s.name}</td>
                  <td className="p-2">{show(s.assessmentPercent)}</td>
                  <td className="p-2">{show(s.interviewPercent)}</td>
                  <td className="p-2 font-semibold">{show(s.demonstrated)}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${VERDICTS[s.verdict].style}`}>
                      {VERDICTS[s.verdict].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {extraSkills.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-1">Hidden strengths (not on your resume)</h3>
          <div className="flex flex-wrap gap-2">
            {extraSkills.map((s) => (
              <span key={s.name} className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                {s.name} • {s.assessmentPercent}%
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">Consider adding these to your resume.</p>
        </div>
      )}
    </div>
  );
}