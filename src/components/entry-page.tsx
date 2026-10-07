import { AssetImage } from "./asset-image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Entry } from "@/lib/schema";
import { Cover } from "./site";
import { RichText } from "./rich-text";
export function EntryPage({ entry: e, kind }: { entry: Entry; kind: string }) {
  return (
    <article className="wrap section entry-page">
      <Link
        className="text-link"
        href={kind === "project" ? "/projects" : "/blog"}
      >
        <ArrowLeft size={16} />
        Back to {kind === "project" ? "my work" : "the journal"}
      </Link>
      <header className="entry-header">
        <span className="eyebrow">
          {e.category} {e.date && ` / ${e.date}`}
        </span>
        <h1>{e.title}</h1>
        <p>{e.excerpt}</p>
      </header>
      <div className="entry-cover">
        <Cover entry={e} index={kind === "project" ? 0 : 2} />
      </div>
      {kind === "project" && (
        <div className="entry-facts">
          {e.role && (
            <div>
              <span className="eyebrow">MY CONTRIBUTION</span>
              <p>{e.role}</p>
            </div>
          )}
          {e.skills && (
            <div>
              <span className="eyebrow">SKILLS & TOOLS</span>
              <p>{e.skills}</p>
            </div>
          )}
          {e.url && (
            <a
              className="text-link"
              href={e.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit project <ArrowUpRight size={17} />
            </a>
          )}
        </div>
      )}
      <RichText value={e.body} />
      {e.gallery.length > 0 && (
        <div className="entry-gallery">
          {e.gallery.map((id, i) => (
            <AssetImage
              key={id}
              id={id}
              fallback={`${e.title} — gallery image ${i + 1}`}
              width={1200}
              height={800}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </article>
  );
}
