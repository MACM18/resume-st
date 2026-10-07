import { spawn } from "node:child_process";

const active = new Set();
let stopping = false;

function start(label, command, args) {
  console.log(`${label} starting.`);
  const child = spawn(command, args, { stdio: "inherit" });
  active.add(child);
  const finished = new Promise((resolve) => {
    child.once("error", (error) => {
      console.error(`${label} could not start: ${error.message}`);
    });
    child.once("close", (code, signal) => {
      active.delete(child);
      resolve({ label, code, signal });
    });
  });
  return { child, finished };
}

function stop() {
  stopping = true;
  for (const child of active) child.kill("SIGTERM");
}

process.on("SIGTERM", stop);
process.on("SIGINT", stop);

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for PostgreSQL setup.");
  }
  if (process.env.STARTUP_SETUP !== "false") {
    const setup = start("Database setup", "npm", ["run", "setup"]);
    const result = await setup.finished;
    if (stopping) return;
    if (result.code !== 0) {
      throw new Error("Database setup failed; the site was not started.");
    }
    console.log("Database setup complete.");
  }

  const app = start("Portfolio app", process.execPath, ["server.js"]);
  const worker =
    process.env.RUN_EMAIL_WORKER === "false"
      ? null
      : start("Email worker", "npm", ["run", "worker"]);
  const first = await Promise.race(
    [app, worker].filter(Boolean).map((process) => process.finished),
  );
  const wasStopping = stopping;
  if (!wasStopping) console.error(`${first.label} stopped unexpectedly.`);
  stop();
  await Promise.all(
    [app, worker].filter(Boolean).map((process) => process.finished),
  );
  process.exitCode = wasStopping ? 0 : first.code || 1;
}

main().catch((error) => {
  console.error(error.message);
  stop();
  process.exitCode = 1;
});
