import "dotenv/config";
import { processEmailJob } from "../src/lib/jobs";
import { db } from "../src/lib/db";
let running = true;
process.on("SIGTERM", () => (running = false));
process.on("SIGINT", () => (running = false));
console.log("Email worker ready.");
while (running) {
  try {
    const processed = await processEmailJob();
    if (!processed) await new Promise((r) => setTimeout(r, 3000));
  } catch {
    console.error("Worker unavailable; retrying shortly.");
    await new Promise((r) => setTimeout(r, 5000));
  }
}
await db.$disconnect();
