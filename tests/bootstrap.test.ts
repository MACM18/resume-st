import "dotenv/config";
import { it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
it("provisions both environment accounts and preserves passwords on later deployments", async () => {
  const email1 = `bootstrap-${randomUUID()}@example.test`,
    email2 = `bootstrap-${randomUUID()}@example.test`;
  const env = {
    ...process.env,
    ADMIN_1_EMAIL: email1,
    ADMIN_1_NAME: "Test administrator one",
    ADMIN_1_PASSWORD: `Test-${randomUUID()}`,
    ADMIN_2_EMAIL: email2,
    ADMIN_2_NAME: "Test administrator two",
    ADMIN_2_PASSWORD: `Test-${randomUUID()}`,
  };
  try {
    let result = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/bootstrap.ts"],
      { env, encoding: "utf8" },
    );
    expect(result.status, result.stderr).toBe(0);
    const users = await db.user.findMany({
      where: { email: { in: [email1, email2] } },
      include: { accounts: true },
    });
    expect(users).toHaveLength(2);
    env.ADMIN_1_PASSWORD = "";
    env.ADMIN_2_PASSWORD = "";
    result = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/bootstrap.ts"],
      { env, encoding: "utf8" },
    );
    expect(result.status, result.stderr).toBe(0);
    for (const user of users)
      expect(
        (await db.account.findFirstOrThrow({ where: { userId: user.id } }))
          .password,
      ).toBe(user.accounts[0].password);
  } finally {
    await db.user.deleteMany({ where: { email: { in: [email1, email2] } } });
    await db.$disconnect();
  }
}, 20000);
