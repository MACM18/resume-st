import { db } from "@/lib/db";
import { requireAdmin, failure } from "@/lib/security";
export async function GET() {
  try {
    await requireAdmin();
    return Response.json(
      await db.contact.findMany({
        include: { job: true },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return failure(e);
  }
}
