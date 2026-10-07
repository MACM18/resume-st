import { db } from "@/lib/db";
import {
  requireAdmin,
  sameOrigin,
  failure,
  HttpError,
  readBody,
} from "@/lib/security";
import { putFile, deleteFile } from "@/lib/storage";
import sharp from "sharp";
export async function GET() {
  try {
    await requireAdmin();
    return Response.json(
      await db.media.findMany({ orderBy: { createdAt: "desc" } }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(req: Request) {
  let key: string | undefined;
  try {
    sameOrigin(req);
    await requireAdmin();
    if (Number(req.headers.get("content-length")) > 12 * 1024 * 1024)
      throw new HttpError(413, "Maximum upload size is 10 MB.");
    const body = await readBody(req, 12 * 1024 * 1024);
    const form = await new Response(new Uint8Array(body), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    const alt = String(form.get("alt") || "")
      .trim()
      .slice(0, 300);
    if (!(file instanceof File) || file.size > 10 * 1024 * 1024 || !file.size)
      throw new HttpError(400, "Choose an image or PDF up to 10 MB.");
    let bytes = Buffer.from(await file.arrayBuffer());
    let type = file.type;
    if (type === "application/pdf") {
      if (
        bytes.subarray(0, 5).toString() !== "%PDF-" ||
        !bytes.subarray(-2048).toString().includes("%%EOF")
      )
        throw new HttpError(400, "This is not a valid PDF.");
    } else {
      if (!["image/jpeg", "image/png", "image/webp"].includes(type))
        throw new HttpError(400, "Use a JPEG, PNG, WebP, or PDF file.");
      if (!alt)
        throw new HttpError(
          400,
          "Please describe the image for screen readers.",
        );
      bytes = Buffer.from(
        await sharp(bytes, { limitInputPixels: 40000000 })
          .rotate()
          .resize({
            width: 1800,
            height: 1800,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 84 })
          .toBuffer()
          .catch(() => {
            throw new HttpError(
              400,
              "This image is damaged or too large to process.",
            );
          }),
      );
      type = "image/webp";
    }
    key = `uploads/${crypto.randomUUID()}.${type === "application/pdf" ? "pdf" : "webp"}`;
    await putFile(key, bytes, type);
    const media = await db.media.create({
      data: {
        key,
        name: file.name.slice(0, 180),
        type,
        size: bytes.length,
        alt,
      },
    });
    return Response.json(media);
  } catch (e) {
    if (key) await deleteFile(key).catch(() => {});
    return failure(e);
  }
}
