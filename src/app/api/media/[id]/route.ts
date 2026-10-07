import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { mediaIds } from "@/lib/schema";
import { getFile } from "@/lib/storage";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const media = await db.media.findUnique({ where: { id } });
  if (!media) return new Response("Not found", { status: 404 });
  const docs = await db.document.findMany({
    select: { kind: true, published: true },
  });
  const isPublic = docs.some((d) => mediaIds(d.kind, d.published).includes(id));
  if (!isPublic && !(await auth.api.getSession({ headers: req.headers })))
    return new Response("Not found", { status: 404 });
  try {
    const object = await getFile(media.key);
    const download = new URL(req.url).searchParams.has("download");
    return new Response(object.Body!.transformToWebStream(), {
      headers: {
        "Content-Type": media.type,
        "Content-Length": String(object.ContentLength || media.size),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(media.name)}`,
      },
    });
  } catch {
    return new Response("File unavailable", { status: 503 });
  }
}
