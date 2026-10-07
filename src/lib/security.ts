import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { createHash } from "node:crypto";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new HttpError(401, "Please sign in.");
  return session;
}
export function sameOrigin(req: Request) {
  const expected = new URL(
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ).origin;
  if (req.headers.get("origin") !== expected)
    throw new HttpError(403, "This request is not allowed.");
}
export async function readBody(req: Request, max: number) {
  if (Number(req.headers.get("content-length")) > max)
    throw new HttpError(413, "This request is too large.");
  const reader = req.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        await reader.cancel();
        throw new HttpError(413, "This request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size);
}
export async function readJson(req: Request, max = 100000) {
  const body = (await readBody(req, max)).toString("utf8");
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, "Invalid request.");
  }
}
export async function throttle(req: Request) {
  const ip =
    process.env.TRUST_PROXY === "true"
      ? req.headers.get("x-real-ip") || "unknown"
      : "local";
  const key = createHash("sha256").update(ip).digest("hex");
  const rows = await db.$queryRaw<
    { count: number }[]
  >`INSERT INTO "Throttle" ("key","count","resetAt") VALUES (${key},1,NOW()+INTERVAL '15 minutes') ON CONFLICT ("key") DO UPDATE SET "count"=CASE WHEN "Throttle"."resetAt" < NOW() THEN 1 ELSE "Throttle"."count"+1 END,"resetAt"=CASE WHEN "Throttle"."resetAt" < NOW() THEN NOW()+INTERVAL '15 minutes' ELSE "Throttle"."resetAt" END RETURNING "count"`;
  if (rows[0].count > 5)
    throw new HttpError(
      429,
      "Please wait a little before sending another message.",
    );
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  if (error && typeof error === "object" && "issues" in error)
    return Response.json(
      { error: "Please check your fields.", issues: error.issues },
      { status: 400 },
    );
  console.error(
    "Request failed",
    error instanceof Error ? error.name : "UnknownError",
  );
  return Response.json(
    { error: "Something went wrong. Please try again." },
    { status: 500 },
  );
}
