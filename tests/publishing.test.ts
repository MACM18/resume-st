import "dotenv/config";
import { afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { changeDocument } from "../src/lib/content";
import { demoProjects, demoPortfolio } from "../src/lib/demo";
const ids: string[] = [];
afterAll(async () => {
  await db.document.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});
describe("database publishing", () => {
  it("isolates drafts, publishes a snapshot, and rejects stale edits", async () => {
    const id = `test-${randomUUID()}`;
    ids.push(id);
    const draft = { ...demoProjects[0], slug: id };
    await db.document.create({ data: { id, kind: "project", draft } });
    await changeDocument(id, 1, "publish");
    const edited = { ...draft, title: "Changed only in draft" };
    await changeDocument(id, 2, "save", edited);
    const row = await db.document.findUniqueOrThrow({ where: { id } });
    expect((row.published as typeof draft).title).toBe(draft.title);
    await expect(changeDocument(id, 2, "save", draft)).rejects.toMatchObject({
      status: 409,
    });
    await changeDocument(id, 3, "publish");
    expect(
      (await db.document.findUniqueOrThrow({ where: { id } })).published,
    ).toMatchObject({ title: edited.title });
    await changeDocument(id, 4, "unpublish");
    expect(
      (await db.document.findUniqueOrThrow({ where: { id } })).published,
    ).toBeNull();
  });
  it("allows exactly one concurrent save at a version", async () => {
    const id = `test-${randomUUID()}`;
    ids.push(id);
    await db.document.create({
      data: { id, kind: "post", draft: { ...demoProjects[0], slug: id } },
    });
    const outcomes = await Promise.allSettled([
      changeDocument(id, 1, "save", {
        ...demoProjects[0],
        slug: id,
        title: "First writer",
      }),
      changeDocument(id, 1, "save", {
        ...demoProjects[0],
        slug: id,
        title: "Second writer",
      }),
    ]);
    expect(outcomes.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((x) => x.status === "rejected")).toHaveLength(1);
  });
  it("prevents publishing duplicate URLs", async () => {
    const slug = `test-${randomUUID()}`;
    for (let i = 0; i < 2; i++) {
      const id = `${slug}-${i}`;
      ids.push(id);
      await db.document.create({
        data: { id, kind: "project", draft: { ...demoProjects[0], slug } },
      });
    }
    await changeDocument(`${slug}-0`, 1, "publish");
    await expect(
      changeDocument(`${slug}-1`, 1, "publish"),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("publishes the portfolio atomically and validates asset references", async () => {
    const id = `test-${randomUUID()}`;
    ids.push(id);
    await db.document.create({
      data: { id, kind: "portfolio", draft: demoPortfolio },
    });
    await expect(
      changeDocument(id, 1, "save", { ...demoPortfolio, resume: "missing" }),
    ).rejects.toMatchObject({ status: 400 });
    await changeDocument(id, 1, "publish");
    expect(
      (await db.document.findUniqueOrThrow({ where: { id } })).published,
    ).toEqual(demoPortfolio);
  });
});

it("keeps the published résumé until replacement is published and rejects PDFs as portraits", async () => {
  const id = `test-${randomUUID()}`;
  ids.push(id);
  const media = [`test-${randomUUID()}`, `test-${randomUUID()}`];
  try {
    for (const asset of media)
      await db.media.create({
        data: {
          id: asset,
          key: asset,
          name: "Resume.pdf",
          type: "application/pdf",
          size: 100,
          alt: "",
        },
      });
    await db.document.create({
      data: {
        id,
        kind: "portfolio",
        draft: { ...demoPortfolio, resume: media[0] },
      },
    });
    await changeDocument(id, 1, "publish");
    await changeDocument(id, 2, "save", { ...demoPortfolio, resume: media[1] });
    expect(
      (await db.document.findUniqueOrThrow({ where: { id } })).published,
    ).toMatchObject({ resume: media[0] });
    await expect(
      changeDocument(id, 3, "save", {
        ...demoPortfolio,
        resume: media[1],
        portrait: media[1],
      }),
    ).rejects.toMatchObject({ status: 400 });
    await changeDocument(id, 3, "publish");
    expect(
      (await db.document.findUniqueOrThrow({ where: { id } })).published,
    ).toMatchObject({ resume: media[1] });
  } finally {
    await db.document.deleteMany({ where: { id } });
    await db.media.deleteMany({ where: { id: { in: media } } });
  }
});
