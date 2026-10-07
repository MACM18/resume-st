import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { z } from "zod";
import { db } from "../src/lib/db";

const adminSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  name: z.string().trim().min(1),
  password: z.string().min(12).max(128),
  previousEmail: z.union([z.email(), z.literal("")]).optional(),
});

function requireLocalDevelopment() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Admin sync is unavailable in production mode.");
  }
  const database = new URL(process.env.DATABASE_URL || "");
  const site = new URL(process.env.BETTER_AUTH_URL || "");
  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  if (
    !localHosts.has(database.hostname) ||
    !localHosts.has(site.hostname) ||
    site.protocol !== "http:" ||
    database.searchParams.get("schema") !== "portfolio"
  ) {
    throw new Error(
      "Admin sync requires a local PostgreSQL URL and local HTTP BETTER_AUTH_URL with schema=portfolio.",
    );
  }
}

async function main() {
  requireLocalDevelopment();
  const admins = [1, 2].flatMap((index) => {
    const prefix = `ADMIN_${index}_`;
    const values = {
      email: process.env[prefix + "EMAIL"],
      name: process.env[prefix + "NAME"],
      password: process.env[prefix + "PASSWORD"],
      previousEmail: process.env[prefix + "PREVIOUS_EMAIL"],
    };
    if (Object.values(values).every((value) => !value)) return [];
    const result = adminSchema.safeParse(values);
    if (!result.success) {
      throw new Error(
        `Administrator ${index}: set EMAIL, NAME, and PASSWORD (12–128 characters).`,
      );
    }
    return [{ index, ...result.data }];
  });

  for (const admin of admins) {
    const previousEmail = admin.previousEmail?.trim().toLowerCase();
    const current = await db.user.findUnique({
      where: { email: admin.email },
      include: { accounts: { where: { providerId: "credential" } } },
    });
    if (previousEmail && previousEmail !== admin.email && current) {
      throw new Error(
        `Administrator ${admin.index}: the new email already belongs to an account. Remove PREVIOUS_EMAIL or choose another email.`,
      );
    }
    const user =
      current ||
      (previousEmail
        ? await db.user.findUnique({
            where: { email: previousEmail },
            include: { accounts: { where: { providerId: "credential" } } },
          })
        : null);
    if (previousEmail && !user) {
      throw new Error(
        `Administrator ${admin.index}: PREVIOUS_EMAIL does not match a stored account.`,
      );
    }
    if (!user) {
      const id = randomUUID();
      await db.user.create({
        data: {
          id,
          email: admin.email,
          name: admin.name,
          emailVerified: true,
          accounts: {
            create: {
              id: randomUUID(),
              accountId: id,
              providerId: "credential",
              password: await hashPassword(admin.password),
            },
          },
        },
      });
      console.log(`Development administrator ${admin.index} created.`);
      continue;
    }
    const credential = user.accounts[0];
    const passwordChanged =
      !credential?.password ||
      !(await verifyPassword({
        hash: credential.password,
        password: admin.password,
      }));
    const profileChanged =
      user.email !== admin.email || user.name !== admin.name;
    if (!passwordChanged && !profileChanged) {
      console.log(
        `Development administrator ${admin.index} already matches .env.`,
      );
      continue;
    }
    const passwordHash = passwordChanged
      ? await hashPassword(admin.password)
      : undefined;
    await db.$transaction(async (tx) => {
      if (profileChanged) {
        await tx.user.update({
          where: { id: user.id },
          data: { email: admin.email, name: admin.name, emailVerified: true },
        });
      }
      if (passwordHash) {
        if (credential) {
          await tx.account.update({
            where: { id: credential.id },
            data: { password: passwordHash },
          });
        } else {
          await tx.account.create({
            data: {
              id: randomUUID(),
              userId: user.id,
              accountId: user.id,
              providerId: "credential",
              password: passwordHash,
            },
          });
        }
      }
      await tx.session.deleteMany({ where: { userId: user.id } });
    });
    console.log(
      `Development administrator ${admin.index} synchronized from .env.`,
    );
  }
  if (admins.length === 0)
    console.log("No development administrators configured; skipped.");
}

try {
  await main();
} finally {
  await db.$disconnect();
}
