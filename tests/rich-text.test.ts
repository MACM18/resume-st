import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { RichText } from "../src/components/rich-text";

describe("visual editor Markdown compatibility", () => {
  it("preserves existing story formatting through editor import and export", () => {
    const existing = [
      "## A little beginning",
      "",
      "A **bold** idea with *care* and [a link](https://example.com).",
      "",
      "- First step",
      "- Second step",
      "",
      "> A useful note",
      "",
      "`code`",
    ].join("\n");
    const editor = new Editor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          underline: false,
          strike: false,
        }),
        Markdown,
      ],
      content: existing,
      contentType: "markdown",
    });
    try {
      const saved = editor.getMarkdown();
      expect(saved).toContain("## A little beginning");
      expect(saved).toContain("**bold**");
      expect(saved).toContain("*care*");
      expect(saved).toContain("[a link](https://example.com)");
      expect(saved).toContain("- Second step");
      expect(saved).toContain("> A useful note");
      expect(saved).toContain("`code`");
    } finally {
      editor.destroy();
    }
  });

  it("serializes visual bold and link edits back to Markdown", () => {
    const editor = new Editor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          underline: false,
          strike: false,
        }),
        Markdown,
      ],
      content: "hello world",
      contentType: "markdown",
    });
    try {
      editor.commands.setTextSelection({ from: 1, to: 6 });
      editor.commands.toggleBold();
      editor.commands.setTextSelection({ from: 7, to: 12 });
      editor.commands.setLink({ href: "https://example.com" });
      expect(editor.getMarkdown()).toBe(
        "**hello** [world](https://example.com)",
      );
    } finally {
      editor.destroy();
    }
  });

  it("renders About formatting without raw HTML or unsafe links", () => {
    const html = renderToStaticMarkup(
      createElement(RichText, {
        compact: true,
        value:
          "Hello **friend**. [Safe](https://example.com) [Unsafe](javascript:alert(1)) <script>alert(1)</script>",
      }),
    );
    expect(html).toContain("prose-compact");
    expect(html).toContain("<strong>friend</strong>");
    expect(html).toContain('href="https://example.com"');
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<script>");
  });
});
