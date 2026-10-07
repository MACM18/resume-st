import Markdown from "react-markdown";
export function RichText({
  value,
  compact = false,
}: {
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "prose prose-compact" : "prose"}>
      <Markdown
        skipHtml
        allowedElements={[
          "p",
          "h2",
          "h3",
          "strong",
          "em",
          "ul",
          "ol",
          "li",
          "blockquote",
          "a",
          "code",
          "pre",
          "hr",
          "br",
        ]}
        components={{
          a: ({ href, children }) =>
            href &&
            (/^https?:\/\//i.test(href) ||
              /^mailto:/i.test(href) ||
              (href.startsWith("/") && !href.startsWith("//"))) ? (
              <a href={href} rel="noopener noreferrer">
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
        }}
      >
        {value}
      </Markdown>
    </div>
  );
}
