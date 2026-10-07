import { db } from "./db";
import { sendMail } from "./mail";
export async function processEmailJob() {
  await db.emailJob.updateMany({
    where: {
      status: "sending",
      attempts: { gte: 5 },
      lockedAt: { lt: new Date(Date.now() - 300000) },
    },
    data: {
      status: "failed",
      lockedAt: null,
      lastError: "Delivery was interrupted. Review and retry this alert.",
    },
  });
  const claimed = await db.$queryRaw<
    { id: string; attempts: number }[]
  >`UPDATE "EmailJob" SET "status"='sending',"lockedAt"=NOW(),"attempts"="attempts"+1 WHERE "id"=(SELECT "id" FROM "EmailJob" WHERE ("status"='pending' AND "nextAttempt"<=NOW()) OR ("status"='sending' AND "lockedAt"<NOW()-INTERVAL '5 minutes') ORDER BY "nextAttempt" FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING "id","attempts"`;
  if (!claimed.length) return false;
  const claim = claimed[0];
  const job = await db.emailJob.findUnique({
    where: { id: claim.id },
    include: { contact: true },
  });
  if (!job) return true;
  try {
    if (!process.env.CONTACT_TO) throw new Error("Recipient not configured");
    const c = job.contact;
    await sendMail(
      process.env.CONTACT_TO,
      `Portfolio inquiry: ${c.subject}`,
      `From: ${c.name} <${c.email}>\n\n${c.message}\n\nView your inbox: ${process.env.BETTER_AUTH_URL}/admin`,
      c.email,
      `<portfolio-${job.id}@${new URL(process.env.BETTER_AUTH_URL || "http://localhost").hostname}>`,
    );
    await db.emailJob.updateMany({
      where: { id: job.id, status: "sending", attempts: claim.attempts },
      data: {
        status: "sent",
        sentAt: new Date(),
        lockedAt: null,
        lastError: null,
      },
    });
  } catch {
    await db.emailJob.updateMany({
      where: { id: job.id, status: "sending", attempts: claim.attempts },
      data: {
        status: claim.attempts >= 5 ? "failed" : "pending",
        nextAttempt: new Date(
          Date.now() + Math.min(3600000, 30000 * 2 ** claim.attempts),
        ),
        lockedAt: null,
        lastError: "Email delivery failed. Check SMTP and recipient settings.",
      },
    });
  }
  return true;
}
