import "dotenv/config";
import { it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { verifyPassword } from "better-auth/crypto";
import { db } from "../src/lib/db";

it("updates a local administrator password and email while refusing production mode", async () => {
  const originalEmail = `sync-${randomUUID()}@example.test`;
  const updatedEmail = `sync-${randomUUID()}@example.test`;
  const firstPassword = `First-${randomUUID()}`;
  const updatedPassword = `Second-${randomUUID()}`;
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "development",
    ADMIN_1_EMAIL: originalEmail,
    ADMIN_1_NAME: "Local test admin",
    ADMIN_1_PASSWORD: firstPassword,
    ADMIN_1_PREVIOUS_EMAIL: "",
    ADMIN_2_EMAIL: "",
    ADMIN_2_NAME: "",
    ADMIN_2_PASSWORD: "",
    ADMIN_2_PREVIOUS_EMAIL: "",
  };
  const run = (settings: NodeJS.ProcessEnv) =>
    spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/sync-dev-admin.ts"],
      {
        env: settings,
        encoding: "utf8",
      },
    );
  try {
    let result = run({ ...env, NODE_ENV: "production" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("unavailable in production mode");

    result = run(env);
    expect(result.status, result.stderr).toBe(0);
    env.ADMIN_1_EMAIL = updatedEmail;
    env.ADMIN_1_PASSWORD = updatedPassword;
    env.ADMIN_1_PREVIOUS_EMAIL = originalEmail;
    result = run(env);
    expect(result.status, result.stderr).toBe(0);

    expect(await db.user.count({ where: { email: originalEmail } })).toBe(0);
    const user = await db.user.findUniqueOrThrow({
      where: { email: updatedEmail },
      include: { accounts: { where: { providerId: "credential" } } },
    });
    expect(
      await verifyPassword({
        hash: user.accounts[0].password!,
        password: updatedPassword,
      }),
    ).toBe(true);
    expect(
      await verifyPassword({
        hash: user.accounts[0].password!,
        password: firstPassword,
      }),
    ).toBe(false);
  } finally {
    await db.user.deleteMany({
      where: { email: { in: [originalEmail, updatedEmail] } },
    });
    await db.$disconnect();
  }
}, 30000);
