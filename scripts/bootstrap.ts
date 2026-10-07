import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { db } from "../src/lib/db";
const schema = z.object({
  email: z.email().transform((v) => v.toLowerCase()),
  name: z.string().min(1),
  password: z.string().min(12).max(128),
});
for (const index of [1, 2]) {
  const prefix = `ADMIN_${index}_`;
  const values = {
    email: process.env[prefix + "EMAIL"],
    name: process.env[prefix + "NAME"],
    password: process.env[prefix + "PASSWORD"],
  };
  if (!values.email && !values.name && !values.password) continue;
  const emailResult = z.email().safeParse(values.email?.toLowerCase());
  if (
    emailResult.success &&
    (await db.user.findUnique({ where: { email: emailResult.data } }))
  ) {
    console.log(`Administrator ${index} already exists; unchanged.`);
    continue;
  }
  const parsed = schema.safeParse(values);
  if (!parsed.success)
    throw new Error(
      `Administrator ${index}: provide valid EMAIL, NAME, and a PASSWORD of 12–128 characters.`,
    );
  const { email, name, password } = parsed.data;
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
  console.log(`Administrator ${index} created.`);
}
await db.$disconnect();
