import { spawn, execFile } from "child_process";
import crypto from "crypto";
import fs from "fs/promises";
import os from "os";
import path from "path";

// Container start hone ka time bhi isi mein ginta hai, isliye local runner (3s) se zyada
const TIME_LIMIT_MS = 6000;
const MAX_OUTPUT_CHARS = 100 * 1024;
const MAX_PARALLEL = 3;

// Nayi language = yahan ek entry
const LANGUAGES = {
  javascript: {
    image: "node:20-alpine",
    file: "solution.cjs",
    command: ["node", "--max-old-space-size=96", "/sandbox/solution.cjs"],
  },
  python: {
    image: "python:3.12-alpine",
    file: "solution.py",
    command: ["python", "/sandbox/solution.py"],
  },
};

export const isDockerLanguage = (language) =>
  Object.hasOwn(LANGUAGES, language);

// ---------- Ek saath kitne containers: simple queue ----------
let running = 0;
const waiting = [];

async function acquireSlot() {
  if (running < MAX_PARALLEL) {
    running++;
    return;
  }
  await new Promise((resolve) => waiting.push(resolve)); // slot milte hi resolve
}

function releaseSlot() {
  const next = waiting.shift();
  if (next)
    next(); // slot seedha agle ko de do
  else running--;
}

// ---------- Startup check ----------
export function isDockerAvailable() {
  return new Promise((resolve) => {
    execFile("docker", ["info"], { timeout: 10000 }, (error) =>
      resolve(!error),
    );
  });
}

// ---------- Main ----------
export async function runInDocker(language, code, input) {
  const config = LANGUAGES[language];
  if (!config) throw new Error(`No Docker config for ${language}`);

  await acquireSlot();
  let dir;
  try {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "sandbox-"));
    await fs.chmod(dir, 0o755); // container ka user (1000) folder padh sake
    await fs.writeFile(path.join(dir, config.file), code, { mode: 0o644 });
    return await execute(config, dir, input);
  } finally {
    if (dir) await fs.rm(dir, { recursive: true, force: true });
    releaseSlot();
  }
}

function execute(config, dir, input) {
  return new Promise((resolve) => {
    const name = `sandbox-${crypto.randomBytes(6).toString("hex")}`;

    const args = [
      "run",
      "--rm",
      "-i",
      "--name",
      name,
      "--network",
      "none",
      "--memory",
      "256m",
      "--memory-swap",
      "256m",
      "--cpus",
      "0.5",
      "--pids-limit",
      "64",
      "--read-only",
      "--tmpfs",
      "/tmp:rw,noexec,size=16m",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges",
      "--user",
      "1000:1000",
      // --mount use kiya (-v nahi), kyunki Windows path mein ":" hota hai
      "--mount",
      `type=bind,source=${dir},target=/sandbox,readonly`,
      "-w",
      "/sandbox",
      config.image,
      ...config.command,
    ];

    const child = spawn("docker", args);
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let spawnFailed = false;

    // Docker CLI ko kill karna kaafi nahi, container ko naam se hatao
    const stopContainer = () => {
      spawn("docker", ["rm", "-f", name], { stdio: "ignore" }).on(
        "error",
        () => {},
      );
      child.kill("SIGKILL");
    };

    const timer = setTimeout(() => {
      timedOut = true;
      stopContainer();
    }, TIME_LIMIT_MS);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > MAX_OUTPUT_CHARS) stopContainer(); // infinite print
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });

    child.stdin.on("error", () => {});
    child.stdin.write(input || "");
    child.stdin.end();

    child.on("error", (err) => {
      // docker install hi nahi hai (ENOENT)
      spawnFailed = true;
      console.error("Docker spawn error:", err.message);
    });

    child.on("close", (exitCode) => {
      clearTimeout(timer);

      // 125 = docker khud fail hua (daemon band, image nahi mila...). Details sirf server log mein
      if (spawnFailed || (exitCode === 125 && !timedOut)) {
        console.error("Docker infrastructure error:", stderr.slice(0, 500));
        return resolve({
          stdout: "",
          stderr:
            "Code runner is unavailable right now. Please tell the recruiter.",
          timedOut: false,
          exitCode: -1,
        });
      }

      // 137 = kill hua (zyada memory use). timedOut ho to wo alag cheez hai
      if (exitCode === 137 && !timedOut) stderr = "Memory limit exceeded.";

      resolve({
        stdout: stdout.slice(0, MAX_OUTPUT_CHARS),
        stderr: stderr.slice(0, 2000),
        timedOut,
        exitCode,
      });
    });
  });
}
