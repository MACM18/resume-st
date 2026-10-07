import { describe, it, expect } from "vitest";
import {
  contactSchema,
  entrySchema,
  portfolioSchema,
  webUrl,
  mediaIds,
} from "../src/lib/schema";
import { demoPortfolio, demoProjects } from "../src/lib/demo";
describe("content boundaries", () => {
  it("accepts complete portfolio and project content", () => {
    expect(portfolioSchema.parse(demoPortfolio).name).toBe("Sehani");
    expect(entrySchema.parse(demoProjects[0]).slug).toBe("small-ideas");
  });
  it("rejects unsafe social and project URLs", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:text/html,bad",
      "file:///etc/passwd",
    ])
      expect(webUrl.safeParse(url).success).toBe(false);
  });
  it("rejects empty, oversized, or malformed contact requests", () => {
    const valid = {
      name: "Visitor",
      email: "visitor@example.com",
      subject: "An opportunity",
      message: "A thoughtful message to say hello.",
    };
    expect(contactSchema.safeParse(valid).success).toBe(true);
    for (const value of [
      { ...valid, email: "bad" },
      { ...valid, message: "x" },
      { ...valid, message: "a".repeat(5001) },
    ])
      expect(contactSchema.safeParse(value).success).toBe(false);
  });
  it("finds every referenced asset without confusing ordinary text", () => {
    expect(
      mediaIds("portfolio", { portrait: "one", resume: "two", name: "three" }),
    ).toEqual(["one", "two"]);
    expect(
      mediaIds("post", { cover: "one", gallery: ["two", "", "three"] }),
    ).toEqual(["one", "two", "three"]);
  });
  it("enforces slugs, gallery limits, and ordering", () => {
    expect(
      entrySchema.safeParse({ ...demoProjects[0], slug: "../private" }).success,
    ).toBe(false);
    expect(
      entrySchema.safeParse({ ...demoProjects[0], order: -1 }).success,
    ).toBe(false);
    expect(
      entrySchema.safeParse({
        ...demoProjects[0],
        gallery: Array(21).fill("asset"),
      }).success,
    ).toBe(false);
  });
});
