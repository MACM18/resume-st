import "dotenv/config";
import {
  test,
  expect,
  request as playwrightRequest,
  type APIRequestContext,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { db } from "../../src/lib/db";
import { processEmailJob } from "../../src/lib/jobs";
const password = `Test-${randomUUID()}!`;
const users = [
  {
    id: `test-${randomUUID()}`,
    name: "Test Owner",
    email: `owner-${randomUUID()}@example.test`,
  },
  {
    id: `test-${randomUUID()}`,
    name: "Test MACM",
    email: `macm-${randomUUID()}@example.test`,
  },
];
const docIds: string[] = [],
  assetIds: string[] = [],
  contactIds: string[] = [];
const origin = process.env.TEST_BASE_URL || "http://localhost:3000";
let admin: APIRequestContext, second: APIRequestContext;
test.beforeAll(async () => {
  for (const user of users)
    await db.user.create({
      data: {
        ...user,
        emailVerified: true,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: user.id,
            providerId: "credential",
            password: await hashPassword(password),
          },
        },
      },
    });
  admin = await playwrightRequest.newContext({
    baseURL: origin,
    extraHTTPHeaders: { origin },
  });
  second = await playwrightRequest.newContext({
    baseURL: origin,
    extraHTTPHeaders: { origin },
  });
  for (const [i, context] of [admin, second].entries()) {
    const r = await context.post("/api/auth/sign-in/email", {
      data: { email: users[i].email, password },
    });
    expect(r.ok(), await r.text()).toBeTruthy();
  }
});
test.afterAll(async () => {
  for (const id of docIds) {
    const d = await db.document.findUnique({ where: { id } });
    if (d)
      await admin.patch(`/api/admin/documents/${id}`, {
        data: { version: d.version, action: "delete" },
      });
  }
  for (const id of assetIds) await admin.delete(`/api/admin/media/${id}`);
  await db.contact.deleteMany({ where: { id: { in: contactIds } } });
  await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
  await admin.dispose();
  await second.dispose();
  await db.$disconnect();
});
test("scrapbook pages are responsive, keyboard accessible, and respect reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sehani");
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to content")).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("link", { name: "My work", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Work with",
  );
  await page.goto("/blog");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "journal",
  );
});
test("private routes, sign-up, and cross-origin writes are protected", async ({
  request,
}) => {
  expect((await request.get("/api/admin/documents")).status()).toBe(401);
  expect((await request.get("/api/admin/media")).status()).toBe(401);
  const preview = await request.get("/admin/preview/portfolio", {
    maxRedirects: 0,
  });
  expect([200, 302, 307]).toContain(preview.status());
  expect(await preview.text()).not.toContain("PRIVATE DRAFT PREVIEW");
  expect(
    (
      await request.post("/api/auth/sign-up/email", {
        headers: { origin },
        data: { email: "intruder@example.test", password, name: "Intruder" },
      })
    ).ok(),
  ).toBeFalsy();
  expect(
    (
      await admin.post("/api/admin/documents", {
        headers: { origin: "https://evil.example" },
        data: { kind: "post" },
      })
    ).status(),
  ).toBe(403);
});
test("both accounts edit, preview, publish, resolve conflicts, and unpublish", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(users[0].email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Open my studio" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole("heading", { name: /Hello, Test/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/studio-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "My profile", exact: true }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Sehani");
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "New project" }).click();
  await expect(page.getByLabel("Title", { exact: true })).toBeVisible();
  const slug = `browser-${randomUUID()}`;
  await page
    .getByLabel("Title", { exact: true })
    .fill("A browser-tested story");
  await page.getByLabel("URL slug").fill(slug);
  await page
    .getByLabel("Full story")
    .fill(
      "## A meaningful heading\nSafe **formatted** content.\n<script>alert('unsafe')</script>",
    );
  const saved = page.waitForResponse(
    (r) =>
      r.url().includes("/api/admin/documents/") &&
      r.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  let doc = await (await saved).json();
  docIds.push(doc.id);
  await expect(page.getByRole("status")).toContainText("Draft saved");
  expect((await request.get(`/projects/${slug}`)).status()).toBe(404);
  expect((await second.get(`/admin/preview/${doc.id}`)).status()).toBe(200);
  const edited = await second.patch(`/api/admin/documents/${doc.id}`, {
    data: {
      version: doc.version,
      action: "save",
      data: { ...doc.draft, title: "Edited by second administrator" },
    },
  });
  expect(edited.ok()).toBeTruthy();
  expect(
    (
      await admin.patch(`/api/admin/documents/${doc.id}`, {
        data: { version: doc.version, action: "save", data: doc.draft },
      })
    ).status(),
  ).toBe(409);
  doc = await edited.json();
  let response = await admin.patch(`/api/admin/documents/${doc.id}`, {
    data: { version: doc.version, action: "publish" },
  });
  expect(response.ok()).toBeTruthy();
  doc = await response.json();
  const publicPage = await request.get(`/projects/${slug}`);
  expect(publicPage.status()).toBe(200);
  expect(await publicPage.text()).toContain("Edited by second administrator");
  response = await admin.patch(`/api/admin/documents/${doc.id}`, {
    data: { version: doc.version, action: "unpublish" },
  });
  expect(response.ok()).toBeTruthy();
  expect((await request.get(`/projects/${slug}`)).status()).toBe(404);
});
test("private uploads, published access, reference protection, and revocation", async ({
  request,
}) => {
  const bytes = await sharp({
    create: { width: 200, height: 150, channels: 3, background: "#f1cc39" },
  })
    .png()
    .toBuffer();
  let r = await admin.post("/api/admin/media", {
    multipart: {
      alt: "A yellow test image",
      file: { name: "test-image.png", mimeType: "image/png", buffer: bytes },
    },
  });
  expect(r.ok(), await r.text()).toBeTruthy();
  const media = await r.json();
  assetIds.push(media.id);
  expect((await request.get(`/api/media/${media.id}`)).status()).toBe(404);
  expect((await admin.get(`/api/media/${media.id}`)).status()).toBe(200);
  expect(
    (
      await admin.post("/api/admin/media", {
        multipart: {
          alt: "Unsafe vector",
          file: {
            name: "bad.svg",
            mimeType: "image/svg+xml",
            buffer: Buffer.from('<svg onload="alert(1)"/>'),
          },
        },
      })
    ).status(),
  ).toBe(400);
  r = await admin.post("/api/admin/documents", { data: { kind: "post" } });
  let doc = await r.json();
  docIds.push(doc.id);
  r = await admin.patch(`/api/admin/documents/${doc.id}`, {
    data: {
      version: doc.version,
      action: "save",
      data: { ...doc.draft, cover: media.id },
    },
  });
  expect(r.ok()).toBeTruthy();
  doc = await r.json();
  expect((await admin.delete(`/api/admin/media/${media.id}`)).status()).toBe(
    409,
  );
  r = await admin.patch(`/api/admin/documents/${doc.id}`, {
    data: { version: doc.version, action: "publish" },
  });
  doc = await r.json();
  expect((await request.get(`/api/media/${media.id}`)).status()).toBe(200);
  await admin.patch(`/api/admin/documents/${doc.id}`, {
    data: { version: doc.version, action: "unpublish" },
  });
  expect((await request.get(`/api/media/${media.id}`)).status()).toBe(404);
});
test("contact submissions persist through SMTP failure and retry successfully", async ({
  request,
}) => {
  const email = `visitor-${randomUUID()}@example.test`;
  const r = await request.post("/api/contact", {
    headers: { origin },
    data: {
      name: "Test Visitor",
      email,
      subject: "A test hello",
      message: "This is a test of reliable contact delivery.",
      website: "",
    },
  });
  expect(r.ok()).toBeTruthy();
  const contact = await db.contact.findFirstOrThrow({
    where: { email },
    include: { job: true },
  });
  contactIds.push(contact.id);
  const previous = process.env.SMTP_PORT;
  process.env.SMTP_PORT = "1";
  await processEmailJob();
  let job = await db.emailJob.findUniqueOrThrow({
    where: { contactId: contact.id },
  });
  expect(job.status).toBe("pending");
  expect(job.attempts).toBe(1);
  expect(await db.contact.count({ where: { id: contact.id } })).toBe(1);
  process.env.SMTP_PORT = previous;
  await db.emailJob.update({
    where: { contactId: contact.id },
    data: { nextAttempt: new Date(0) },
  });
  await processEmailJob();
  job = await db.emailJob.findUniqueOrThrow({
    where: { contactId: contact.id },
  });
  expect(job.status).toBe("sent");
  expect(
    (
      await second.patch(`/api/admin/inbox/${contact.id}`, {
        data: { action: "read" },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (await db.contact.findUniqueOrThrow({ where: { id: contact.id } })).status,
  ).toBe("read");
  const before = await db.contact.count();
  await request.post("/api/contact", {
    headers: { origin },
    data: {
      name: "Bot Visitor",
      email,
      subject: "A test hello",
      message: "This should be ignored as a bot.",
      website: "spam.example",
    },
  });
  expect(await db.contact.count()).toBe(before);
});

test("password recovery sends a local email and revokes existing sessions", async ({
  request,
}) => {
  const result = await request.post("/api/auth/request-password-reset", {
    headers: { origin },
    data: { email: users[1].email, redirectTo: origin + "/reset-password" },
  });
  expect(result.ok(), await result.text()).toBeTruthy();
  const messages = await (
    await fetch("http://localhost:8025/api/v1/messages")
  ).json();
  const message = messages.messages.find((m: { To: { Address: string }[] }) =>
    m.To.some((t) => t.Address === users[1].email),
  );
  expect(message).toBeTruthy();
  const mail = await (
    await fetch(`http://localhost:8025/api/v1/message/${message.ID}`)
  ).json();
  const link = mail.Text.match(/https?:\/\/[^\s]+/)[0];
  const response = await request.get(link, { maxRedirects: 0 });
  const redirect = response.headers().location;
  expect(redirect).toContain("/reset-password");
  const token = new URL(redirect, origin).searchParams.get("token");
  expect(token).toBeTruthy();
  const reset = await request.post("/api/auth/reset-password", {
    headers: { origin },
    data: { token, newPassword: `New-${password}` },
  });
  expect(reset.ok(), await reset.text()).toBeTruthy();
  expect((await second.get("/api/admin/documents")).status()).toBe(401);
});
