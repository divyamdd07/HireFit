import { runJavaScript } from "./javascript.runner.js";
import { runInDocker, isDockerLanguage, isDockerAvailable } from "./docker.runner.js";

// docker | local | disabled.
// .env mein na likha ho to: production mein disabled (safe), development mein local
export function executionMode() {
  const mode = process.env.EXECUTION_MODE;
  if (["docker", "local", "disabled"].includes(mode)) return mode;
  return process.env.NODE_ENV === "production" ? "disabled" : "local";
}

const LOCAL_RUNNERS = {
  javascript: runJavaScript,
};

function getRunner(language) {
  const mode = executionMode();
  if (mode === "docker") {
    return isDockerLanguage(language) ? (code, input) => runInDocker(language, code, input) : null;
  }
  if (mode === "local") return LOCAL_RUNNERS[language] || null;
  return null; // disabled
}

export const isSupportedLanguage = (language) => Boolean(getRunner(language));

export async function checkExecutionEnvironment() {
  const mode = executionMode();
  if (mode === "disabled") return console.warn("Code execution: DISABLED (coding questions cannot be run)");
  if (mode === "local") return console.warn("Code execution: LOCAL mode (NOT secure, use only on your own laptop)");

  const ok = await isDockerAvailable();
  console.log(
    ok
      ? "Code execution: DOCKER mode (isolated containers)"
      : "WARNING: EXECUTION_MODE=docker but Docker is not running. Code runs will fail."
  );
}

const normalize = (text) =>
  String(text)
    .replace(/\r\n/g, "\n")
    .trim()
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n");

export async function runTestCases(language, code, testCases) {
  const runner = getRunner(language);
  const results = [];

  for (const testCase of testCases) {
    const out = await runner(code, testCase.input);
    const actual = normalize(out.stdout);
    const expected = normalize(testCase.expectedOutput);

    results.push({
      input: testCase.input,
      expected,
      actual,
      passed: !out.timedOut && out.exitCode === 0 && actual === expected,
      timedOut: out.timedOut,
      error: out.stderr,
    });
  }
  return results;
}