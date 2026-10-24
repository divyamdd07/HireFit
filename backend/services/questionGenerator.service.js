import { askForJson } from "./aiClient.js";
import { cleanQuestion } from "./question.service.js";

export async function generateQuestions({ jobTitle, skills, difficulty, durationMinutes, mcqCount, codingCount }) {
  const prompt = `You are a technical interviewer creating an assessment.

Role: ${jobTitle}
Skills to test: ${skills.join(", ") || "general programming"}
Difficulty: ${difficulty}
Total assessment duration: ${durationMinutes} minutes

Create exactly ${mcqCount} MCQ questions and ${codingCount} coding problems.
Return ONLY a valid JSON array (no markdown, no explanation). Each item must have one of these shapes:

MCQ:
{ "type": "mcq", "text": "question", "skill": "one skill from the list", "points": 10,
  "options": ["A", "B", "C", "D"], "correctIndex": 0 }

Coding:
{ "type": "coding", "title": "short title", "text": "full problem statement with input/output format",
  "skill": "one skill from the list", "points": 20, "constraints": "e.g. 1 <= n <= 1000",
  "testCases": [ { "input": "string", "expectedOutput": "string", "isHidden": false } ] }

Rules:
- Coding problems must read from standard input and print to standard output. Keep the input format very simple (numbers or words separated by spaces or new lines).
- Give exactly 2 sample test cases (isHidden false) and 3 hidden test cases (isHidden true) per coding problem.
- Solve each coding problem yourself and double-check that every expectedOutput is exactly correct.
- MCQs must have exactly 4 options and only one correct answer. "correctIndex" is a number from 0 to 3.
- Questions must match the difficulty and be practical for the role.`;

  const items = await askForJson(prompt);
  const list = Array.isArray(items) ? items : items.questions || [];

  // Sirf valid questions rakho, galat wale chupchap skip
  const valid = [];
  for (const item of list) {
    try {
      valid.push(cleanQuestion(item, "ai"));
    } catch (err) {
      console.warn("Skipped invalid AI question:", err.message);
    }
  }
  return valid;
}