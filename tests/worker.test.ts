import "dotenv/config";
import { afterAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { processEmailJob } from "../src/lib/jobs";
const ids: string[] = [];
afterAll(async () => {
  await db.contact.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});
it("marks an exhausted stale claim failed rather than sending a sixth email", async () => {
  const id = `test-${randomUUID()}`;
  ids.push(id);
  await db.contact.create({
    data: {
      id,
      name: "Test",
      email: "test@example.test",
      subject: "Test stale job",
      message: "Testing stale recovery",
      job: {
        create: { status: "sending", attempts: 5, lockedAt: new Date(0) },
      },
    },
  });
  await processEmailJob();
  expect(
    await db.emailJob.findUniqueOrThrow({ where: { contactId: id } }),
  ).toMatchObject({ status: "failed", attempts: 5, lockedAt: null });
});
