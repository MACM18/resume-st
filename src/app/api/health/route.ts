import { db } from "@/lib/db";
export async function GET() {
  try {
    // A reachable database is not enough: a single-image deployment may skip setup.
    await Promise.all([
      db.document.findFirst({ select: { id: true } }),
      db.user.findFirst({ select: { id: true } }),
    ]);
    return Response.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
