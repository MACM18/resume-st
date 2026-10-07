import { siteData } from "@/lib/site-data";
import { ProjectCard } from "@/components/site";
export const metadata = { title: "My work" };
export default async function Page() {
  const { projects } = await siteData();
  return (
    <section className="wrap section listing">
      <span className="eyebrow">A COLLECTION OF THINGS I’VE MADE</span>
      <h1>
        Work with <span className="serif">a little heart.</span>
      </h1>
      <p className="listing-intro">
        Ideas explored, challenges embraced, and a little bit of me in every
        project.
      </p>
      <div className="projects-grid">
        {projects.map((p, i) => (
          <ProjectCard key={p.slug} entry={p} index={i} />
        ))}
      </div>
      {!projects.length && (
        <p className="empty-state">
          New projects are taking shape. Come back soon.
        </p>
      )}
    </section>
  );
}
