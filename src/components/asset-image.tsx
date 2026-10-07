import { cache } from "react";
import { db } from "@/lib/db";
const asset = cache((id: string) =>
  db.media.findUnique({ where: { id }, select: { alt: true } }),
);
export async function AssetImage({
  id,
  fallback,
  ...props
}: { id: string; fallback: string } & Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "id"
>) {
  if (!id) return null;
  const m = await asset(id);
  return <img {...props} src={`/api/media/${id}`} alt={m?.alt || fallback} />;
}
