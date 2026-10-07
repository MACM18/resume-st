import { db } from "@/lib/db";
import { requireAdmin, sameOrigin, failure, HttpError } from "@/lib/security";
import { contentLock } from "@/lib/content";
import { mediaIds } from "@/lib/schema";
import { deleteFile } from "@/lib/storage";
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(req);
    await requireAdmin();
    const { id } = await params;
    await db.$transaction(
      async (tx) => {
        await contentLock(tx);
        const rows = await tx.document.findMany();
        if (
          rows.some((r) =>
            [
              ...mediaIds(r.kind, r.draft),
              ...mediaIds(r.kind, r.published),
            ].includes(id),
          )
        )
          throw new HttpError(
            409,
            "This file is used in draft or published content. Remove those references first.",
          );
        const media = await tx.media.findUnique({ where: { id } });
        if (!media) throw new HttpError(404, "File not found.");
        await deleteFile(media.key);
        await tx.media.delete({ where: { id } });
      },
      { timeout: 20000 },
    );
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
