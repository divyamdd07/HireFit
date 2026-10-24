const badRequest = (message) => Object.assign(new Error(message), { status: 400 });

// Unknown fields hata deta hai, sahi shape return karta hai, galat ho to error
export function cleanQuestion(raw, source = "manual") {
  const type = raw.type;
  if (!["mcq", "coding"].includes(type)) throw badRequest("Question type must be mcq or coding.");

  const text = String(raw.text || "").trim();
  if (!text) throw badRequest("Question text is required.");

  const question = {
    type,
    text,
    title: String(raw.title || "").trim(),
    skill: String(raw.skill || "").trim(),
    points: Math.max(1, Number(raw.points) || 10),
    source,
  };

  if (type === "mcq") {
    const originalOptions = Array.isArray(raw.options) ? raw.options : [];
    const correctText = String(originalOptions[raw.correctIndex] ?? "").trim();
    const options = originalOptions.map((o) => String(o).trim()).filter(Boolean);

    if (options.length < 2) throw badRequest("MCQ needs at least 2 options.");
    // Khaali options hatane ke baad sahi answer ka index dobara dhundo
    const correctIndex = options.indexOf(correctText);
    if (correctIndex === -1) throw badRequest("Please select the correct option.");

    return { ...question, options, correctIndex };
  }

  // coding
  if (!question.title) throw badRequest("Coding problem needs a title.");

  const testCases = (Array.isArray(raw.testCases) ? raw.testCases : [])
    .map((t) => ({
      input: String(t.input ?? ""),
      expectedOutput: String(t.expectedOutput ?? "").trim(),
      isHidden: t.isHidden === true || t.isHidden === "true",
    }))
    .filter((t) => t.expectedOutput !== "");

  if (testCases.length === 0) throw badRequest("Coding problem needs at least 1 test case.");
  // Run button ke liye kam se kam ek sample case dikhna chahiye
  if (testCases.every((t) => t.isHidden)) testCases[0].isHidden = false;

  return { ...question, constraints: String(raw.constraints || "").trim(), testCases };
}