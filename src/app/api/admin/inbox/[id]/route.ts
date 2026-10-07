import { db } from "@/lib/db";
import {
  requireAdmin,
  sameOrigin,
  readJson,
  failure,
  HttpError,
} from "@/lib/security";
import { z } from "zod";
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(req);
    await requireAdmin();
    const { id } = await params;
    const { action } = z
      .object({
        action: z.enum(["read", "unread", "archived", "delete", "retry"]),
      })
      .parse(await readJson(req));
    if (action === "delete") await db.contact.delete({ where: { id } });
    else if (action === "retry") {
      const result = await db.emailJob.updateMany({
        where: { contactId: id, status: "failed" },
        data: {
          status: "pending",
          attempts: 0,
          nextAttempt: new Date(),
          lastError: null,
          lockedAt: null,
        },
      });
      if (!result.count)
        throw new HttpError(409, "Only failed alerts can be retried.");
    } else await db.contact.update({ where: { id }, data: { status: action } });
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
