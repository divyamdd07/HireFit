import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
  timeout: 120000,
});

export async function analyzeResumeWithAI(resumeText, job) {
  console.log("📄 Resume received by AI service");
  console.log("📏 Resume text length:", resumeText?.length);

  const prompt = `You are an expert ATS resume analyzer.

Read the resume below and return ONLY valid JSON (no markdown, no explanation) in exactly this shape:
{
  "name": "string",
  "email": "string or empty",
  "phone": "string or empty",
  "education": ["string"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "years": number
    }
  ],
  "totalYearsExperience": number,
  "skills": ["string"],
  "projects": ["string"],
  "certifications": ["string"],
  "strengths": ["string"],
  "suggestions": ["specific improvements for this resume for the target job"]
}

Rules:
- Only include information actually present in the resume. Do not invent anything.
- "skills" must be individual skills (e.g. "React", "Node.js"), not sentences.
- "suggestions" should be practical, max 5 items.

Target job: ${job.title}
Job description: ${job.description}

RESUME:
${resumeText}`;

  console.log("🤖 Sending request to NVIDIA AI...");
  console.log("🧠 Model:", process.env.AI_MODEL);

  const startTime = Date.now();

  const response = await client.chat.completions.create({
  model: process.env.AI_MODEL,
  messages: [
    {
      role: "user",
      content: prompt,
    },
  ],
  temperature: 0.2,
  max_tokens: 2000,
  stream: false,
});
  const endTime = Date.now();

  console.log(
    `✅ NVIDIA AI responded in ${(endTime - startTime) / 1000} seconds`
  );

  // Get AI response safely
  const choice = response.choices?.[0];
  const raw = choice?.message?.content || "";

  console.log("📦 AI response received");
  console.log("📏 Response length:", raw.length);
  console.log("🏁 Finish reason:", choice?.finish_reason);

  // If AI returned no actual content
  if (!raw) {
    console.error("❌ AI returned empty content");
    console.dir(response, { depth: null });

    throw Object.assign(
      new Error("AI returned an empty response. Try again."),
      { status: 502 }
    );
  }

  // Remove markdown code fences if AI accidentally adds them
  const cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    const result = JSON.parse(cleaned);

    console.log("✅ AI response converted to JSON successfully");

    return result;
  } catch (error) {
    console.error("❌ AI returned invalid JSON");
    console.error("AI raw response:", raw);

    throw Object.assign(
      new Error("AI returned an invalid response. Try again."),
      { status: 502 }
    );
  }
}