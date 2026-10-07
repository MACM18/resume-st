import Markdown from "react-markdown";
export function RichText({ value }: { value: string }) {
  return (
    <div className="prose">
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
          a: ({ href, children }) => (
            <a href={href} rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {value}
      </Markdown>
    </div>
  );
}
