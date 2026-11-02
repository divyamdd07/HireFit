
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
  timeout: 60000,
  maxRetries: 2,
});

// Prompt bhejo, JSON object/array wapas lo
export async function askForJson(prompt, maxTokens = 6000) {
  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL || "openai/gpt-oss-20b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: maxTokens,
    stream: false,
    response_format: { type: "json_object" },
  });

  const raw = response.choices?.[0]?.message?.content || "";

  const fail = () =>
    Object.assign(
      new Error("AI returned an invalid response. Try again."),
      { status: 502 }
    );

  if (!raw) throw fail();

  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

  const start = cleaned.search(/[\[{]/);
  const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));

  if (start === -1 || end === -1) throw fail();

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    console.error("Invalid JSON from AI:", raw);
    throw fail();
  }
}
