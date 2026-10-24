import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: "https://integrate.api.nvidia.com/v1",
  timeout: 120000,
});

// Prompt bhejo, JSON object/array wapas lo
export async function askForJson(prompt, maxTokens = 6000) {
  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: maxTokens,
    stream: false,
  });

  const raw = response.choices?.[0]?.message?.content || "";
  const fail = () => Object.assign(new Error("AI returned an invalid response. Try again."), { status: 502 });
  if (!raw) throw fail();

  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  // AI kabhi JSON ke aage-peeche text likh deta hai, to pehle [ ya { se aakhri ] ya } tak katdu
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