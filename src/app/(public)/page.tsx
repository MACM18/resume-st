import { Home } from "@/components/site";
import { siteData } from "@/lib/site-data";
export async function generateMetadata() {
  const { portfolio: p, demo } = await siteData();
  return {
    title: p?.seoTitle || p?.name || "Coming soon",
    description: p?.seoDescription,
    robots: demo ? { index: false, follow: false } : undefined,
  };
}
export default async function Page() {
  const d = await siteData();
  if (!d.portfolio)
    return (
      <section className="wrap section coming-soon">
        <span className="eyebrow">SOMETHING LOVELY IS ON ITS WAY</span>
        <h1>
          A new chapter,
          <br />
          <span className="serif">coming soon.</span>
        </h1>
        <p>This little corner is still taking shape. Check back soon.</p>
      </section>
    );
  return <Home profile={d.portfolio} projects={d.projects} posts={d.posts} />;
}
