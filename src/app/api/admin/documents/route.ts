import { db } from "@/lib/db";
import { requireAdmin, sameOrigin, readJson, failure } from "@/lib/security";
import { emptyEntry } from "@/lib/schema";
import { z } from "zod";
export async function GET() {
  try {
    await requireAdmin();
    return Response.json(
      await db.document.findMany({ orderBy: { createdAt: "asc" } }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    await requireAdmin();
    const { kind } = z
      .object({ kind: z.enum(["project", "post"]) })
      .parse(await readJson(req));
    return Response.json(
      await db.document.create({
        data: {
          kind,
          draft: {
            ...emptyEntry,
            title: kind === "project" ? "Untitled project" : "Untitled story",
            slug: `new-${crypto.randomUUID().slice(0, 8)}`,
          },
        },
      }),
    );
  } catch (e) {
    return failure(e);
  }
}
