// Import this exact file to avoid a known pdf-parse bug in ES modules
import pdf from "pdf-parse/lib/pdf-parse.js";

export async function extractTextFromPdf(buffer) {
  const data = await pdf(buffer);
  const text = data.text.trim();

  if (text.length < 50) {
    throw Object.assign(
      new Error("Could not read text from this PDF. It may be a scanned image."),
      { status: 400 }
    );
  }
  return text;
}