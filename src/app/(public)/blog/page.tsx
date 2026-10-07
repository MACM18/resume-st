import Link from "next/link";
import { siteData } from "@/lib/site-data";
import { Cover } from "@/components/site";
export const metadata = { title: "Journal" };
export default async function Page() {
  const { posts } = await siteData();
  return (
    <section className="wrap section listing">
      <span className="eyebrow">PAGES FROM MY NOTEBOOK</span>
      <h1>
        The little <span className="serif">journal.</span>
      </h1>
      <p className="listing-intro">
        Thoughts, discoveries, and things I’d like to remember.
      </p>
      <div className="projects-grid">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="project-card">
            <div className="project-image">
              <Cover entry={p} index={2} />
            </div>
            <div className="card-meta">
              <span>{p.category}</span>
              <span>
                {p.publishedAt?.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </span>
            </div>
            <h3>{p.title}</h3>
            <p>{p.excerpt}</p>
          </Link>
        ))}
      </div>
      {!posts.length && (
        <p className="empty-state">
          A fresh page, waiting for its first story.
        </p>
      )}
    </section>
  );
}
