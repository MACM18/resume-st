import { requireAdmin, sameOrigin, readJson, failure } from "@/lib/security";
import { changeDocument } from "@/lib/content";
import { revalidateTag } from "next/cache";
import { z } from "zod";
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(req);
    await requireAdmin();
    const { id } = await params;
    const body = z
      .object({
        version: z.number().int().positive(),
        action: z.enum(["save", "publish", "unpublish", "delete"]),
        data: z.unknown().optional(),
      })
      .parse(await readJson(req));
    const result = await changeDocument(
      id,
      body.version,
      body.action,
      body.data,
    );
    if (body.action !== "save") revalidateTag("content", { expire: 0 });
    return Response.json(result);
  } catch (e) {
    return failure(e);
  }
}
