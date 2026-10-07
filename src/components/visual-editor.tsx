"use client";

import { useId, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";

type VisualEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
};

const allowedLink = (value: string) => {
  try {
    const url = new URL(value);
    return ["http:", "https:", "mailto:"].includes(url.protocol);
  } catch {
    return false;
  }
};

export function VisualEditor({
  label,
  value,
  onChange,
  maxLength,
}: VisualEditorProps) {
  const id = useId();
  const accepted = useRef(value);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        underline: false,
        strike: false,
        link: {
          openOnClick: false,
          autolink: false,
          linkOnPaste: false,
          isAllowedUri: allowedLink,
        },
      }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-label": label,
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor: updated }) => {
      const markdown = updated.getMarkdown();
      if (markdown.length > maxLength) {
        updated.commands.setContent(accepted.current, {
          contentType: "markdown",
          emitUpdate: false,
        });
        return;
      }
      accepted.current = markdown;
      onChange(markdown);
    },
  });

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      h2: current?.isActive("heading", { level: 2 }) || false,
      h3: current?.isActive("heading", { level: 3 }) || false,
      bold: current?.isActive("bold") || false,
      italic: current?.isActive("italic") || false,
      bulletList: current?.isActive("bulletList") || false,
      orderedList: current?.isActive("orderedList") || false,
      blockquote: current?.isActive("blockquote") || false,
      link: current?.isActive("link") || false,
      code: current?.isActive("code") || false,
      codeBlock: current?.isActive("codeBlock") || false,
    }),
  });

  function editLink() {
    if (!editor) return;
    setLinkUrl((editor.getAttributes("link").href as string | undefined) || "");
    setLinkError("");
    setLinkOpen(true);
  }

  function saveLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const url = linkUrl.trim();
    if (!allowedLink(url)) {
      setLinkError("Enter a full http://, https://, or mailto: URL.");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    setLinkOpen(false);
  }

  const buttons = editor
    ? [
        {
          label: "H2",
          title: "Heading level 2",
          active: active?.h2 || false,
          run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          label: "H3",
          title: "Heading level 3",
          active: active?.h3 || false,
          run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        },
        {
          label: "B",
          title: "Bold",
          active: active?.bold || false,
          run: () => editor.chain().focus().toggleBold().run(),
        },
        {
          label: "I",
          title: "Italic",
          active: active?.italic || false,
          run: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          label: "Bullets",
          title: "Bulleted list",
          active: active?.bulletList || false,
          run: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          label: "Numbers",
          title: "Numbered list",
          active: active?.orderedList || false,
          run: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
          label: "Quote",
          title: "Block quote",
          active: active?.blockquote || false,
          run: () => editor.chain().focus().toggleBlockquote().run(),
        },
        {
          label: "Link",
          title: "Add or edit link",
          active: active?.link || false,
          run: editLink,
        },
        {
          label: "Code",
          title: "Inline code",
          active: active?.code || false,
          run: () => editor.chain().focus().toggleCode().run(),
        },
        {
          label: "Code block",
          title: "Code block",
          active: active?.codeBlock || false,
          run: () => editor.chain().focus().toggleCodeBlock().run(),
        },
      ]
    : [];

  return (
    <div className="visual-editor">
      <label className="visual-editor-label" htmlFor={id}>
        {label}
      </label>
      <div
        className="visual-editor-toolbar"
        role="toolbar"
        aria-label={`${label} formatting`}
      >
        {buttons.map((button) => (
          <button
            key={button.title}
            type="button"
            title={button.title}
            aria-label={button.title}
            aria-pressed={button.active}
            onMouseDown={(event) => event.preventDefault()}
            onClick={button.run}
          >
            {button.label}
          </button>
        ))}
      </div>
      {linkOpen && (
        <form
          className="visual-editor-link"
          onSubmit={saveLink}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setLinkOpen(false);
              editor?.commands.focus();
            }
          }}
        >
          <label htmlFor={`${id}-link`}>Link URL</label>
          <input
            id={`${id}-link`}
            type="text"
            inputMode="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://example.com"
            autoFocus
          />
          <button type="submit">Apply link</button>
          {active?.link && (
            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().unsetLink().run();
                setLinkOpen(false);
              }}
            >
              Remove
            </button>
          )}
          <button type="button" onClick={() => setLinkOpen(false)}>
            Cancel
          </button>
          {linkError && <span role="alert">{linkError}</span>}
        </form>
      )}
      <EditorContent editor={editor} className="visual-editor-content" />
      <p className="visual-editor-hint">
        Formatted text · {value.length.toLocaleString()} /{" "}
        {maxLength.toLocaleString()} characters
      </p>
    </div>
  );
}
