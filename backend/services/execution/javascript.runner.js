import { spawn } from "child_process";
import fs from "fs/promises";
import os from "os";
import path from "path";

const TIME_LIMIT_MS = 3000;
const MAX_OUTPUT_CHARS = 100 * 1024;

export async function runJavaScript(code, input) {
  // Har run ke liye naya temp folder
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "run-"));
  const file = path.join(dir, "solution.cjs"); // .cjs = require() chalega
  try {
    await fs.writeFile(file, code);
    return await execute(file, dir, input);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }); // cleanup, error aaye tab bhi
  }
}

function execute(file, cwd, input) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--max-old-space-size=128", file], {
      cwd,
      // IMPORTANT: process.env pass NAHI kiya, warna candidate ke code ko
      // tumhari API keys aur JWT_SECRET mil jaati
      env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot },
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    // Time limit: 3 sec baad process kill
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, TIME_LIMIT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > MAX_OUTPUT_CHARS) child.kill("SIGKILL"); // infinite print rokne ke liye
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    // Agar code input padhe bina band ho jaye to error ignore karo
    child.stdin.on("error", () => {});
    child.stdin.write(input || "");
    child.stdin.end();

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ stdout: "", stderr: err.message, timedOut: false, exitCode: -1 });
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolve({
        stdout: stdout.slice(0, MAX_OUTPUT_CHARS),
        stderr: stderr.slice(0, 2000),
        timedOut,
        exitCode,
      });
    });
  });
}