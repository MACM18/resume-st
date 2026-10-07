import nodemailer from "nodemailer";
export function mailer() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_FROM)
    throw new Error("SMTP is not configured");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
}
export async function sendMail(
  to: string,
  subject: string,
  text: string,
  replyTo?: string,
  messageId?: string,
) {
  await mailer().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    replyTo,
    messageId,
  });
}
