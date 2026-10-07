import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const schema =
  new URL(
    process.env.DATABASE_URL || "postgresql://localhost/postgres",
  ).searchParams.get("schema") || "public";
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema))
  throw new Error("Invalid database schema");
const globalDb = globalThis as unknown as { db?: PrismaClient };
export const db =
  globalDb.db ??
  new PrismaClient({
    adapter: new PrismaPg(
      {
        connectionString: process.env.DATABASE_URL,
        max: 8,
        connectionTimeoutMillis: 5000,
        options: `-c search_path=${schema}`,
      },
      { schema },
    ),
  });
if (process.env.NODE_ENV !== "production") globalDb.db = db;
