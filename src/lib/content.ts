import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import {
  entrySchema,
  portfolioSchema,
  mediaIds,
  type Portfolio,
  type Entry,
} from "./schema";
import { HttpError } from "./security";
export const publicDocuments = unstable_cache(
  async () =>
    db.document.findMany({
      where: { published: { not: Prisma.DbNull } },
      orderBy: { createdAt: "asc" },
    }),
  ["published-content"],
  { tags: ["content"], revalidate: 300 },
);
export async function publicContent() {
  const rows = await publicDocuments();
  return {
    portfolio: rows.find((r) => r.kind === "portfolio")?.published as
      Portfolio | undefined,
    projects: rows
      .filter((r) => r.kind === "project")
      .map((r) => ({ id: r.id, ...entrySchema.parse(r.published) }))
      .sort((a, b) => a.order - b.order),
    posts: rows
      .filter((r) => r.kind === "post")
      .map((r) => ({
        id: r.id,
        publishedAt: r.publishedAt,
        ...entrySchema.parse(r.published),
      }))
      .sort(
        (a, b) =>
          new Date(b.publishedAt || 0).getTime() -
          new Date(a.publishedAt || 0).getTime(),
      ),
  };
}
export async function contentLock(tx: Prisma.TransactionClient) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(748291)`;
}
export async function validateMedia(
  tx: Prisma.TransactionClient,
  kind: string,
  data: unknown,
) {
  const ids = [...new Set(mediaIds(kind, data))];
  if (!ids.length) return;
  const media = await tx.media.findMany({ where: { id: { in: ids } } });
  if (media.length !== ids.length)
    throw new HttpError(400, "An attachment was deleted. Select it again.");
  for (const m of media) {
    const profile = data as Portfolio;
    const needsPdf = kind === "portfolio" && profile.resume === m.id;
    const needsImage = kind !== "portfolio" || profile.portrait === m.id;
    if (
      (needsPdf && m.type !== "application/pdf") ||
      (needsImage && !m.type.startsWith("image/"))
    )
      throw new HttpError(
        400,
        "Choose an image for photos and a PDF for the résumé.",
      );
  }
}
export async function changeDocument(
  id: string,
  version: number,
  action: "save" | "publish" | "unpublish" | "delete",
  input?: unknown,
) {
  return db.$transaction(async (tx) => {
    await contentLock(tx);
    const doc = await tx.document.findUnique({ where: { id } });
    if (!doc) throw new HttpError(404, "Content not found.");
    if (doc.version !== version)
      throw new HttpError(
        409,
        "Someone else has edited this content. Reload before saving; your changes have not been overwritten.",
      );
    if (action === "delete") {
      if (doc.kind === "portfolio")
        throw new HttpError(400, "The profile cannot be deleted.");
      await tx.document.delete({ where: { id } });
      return null;
    }
    const data =
      action === "save"
        ? doc.kind === "portfolio"
          ? portfolioSchema.parse(input)
          : entrySchema.parse(input)
        : doc.draft;
    await validateMedia(tx, doc.kind, data);
    if (action === "publish" && doc.kind !== "portfolio") {
      const slug = (data as Entry).slug;
      const others = await tx.document.findMany({
        where: { kind: doc.kind, id: { not: id } },
      });
      if (others.some((r) => (r.published as Entry | null)?.slug === slug))
        throw new HttpError(
          409,
          "Another published entry already uses that URL. Choose a different slug.",
        );
    }
    return tx.document.update({
      where: { id },
      data: {
        version: { increment: 1 },
        ...(action === "save"
          ? { draft: data as Prisma.InputJsonValue }
          : action === "publish"
            ? {
                published: data as Prisma.InputJsonValue,
                publishedAt: doc.publishedAt || new Date(),
              }
            : { published: Prisma.DbNull, publishedAt: null }),
      },
    });
  });
}
