import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../src/lib/db";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(),
  name = process.env.ADMIN_NAME,
  password = process.env.ADMIN_PASSWORD;
if (!email || !name || !password || password.length < 12)
  throw new Error(
    "Set ADMIN_EMAIL, ADMIN_NAME, and ADMIN_PASSWORD (12+ characters). No existing account will be overwritten.",
  );
const id = randomUUID();
await db.user.create({
  data: {
    id,
    email,
    name,
    emailVerified: true,
    accounts: {
      create: {
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        password: await hashPassword(password),
      },
    },
  },
});
console.log("Administrator created.");
await db.$disconnect();
