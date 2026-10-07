import { db } from "@/lib/db";
import { contactSchema } from "@/lib/schema";
import { sameOrigin, readJson, throttle, failure } from "@/lib/security";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const body = contactSchema.parse(await readJson(req, 8000));
    if (body.website) return Response.json({ ok: true });
    await throttle(req);
    await db.contact.create({
      data: {
        name: body.name,
        email: body.email,
        subject: body.subject,
        message: body.message,
        job: { create: {} },
      },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
