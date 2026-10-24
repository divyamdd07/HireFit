export default function SkillList({ title, skills, color }) {
  const styles = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      {skills.length === 0 ? (
        <p className="text-sm text-gray-400">None</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className={`px-3 py-1 rounded-full text-sm ${styles[color]}`}>
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}