import { publicContent } from "./content";
import { demoPortfolio, demoProjects, demoPost } from "./demo";
export async function siteData() {
  const data = await publicContent();
  const demo = !data.portfolio && process.env.DEMO_MODE === "true";
  return {
    ...data,
    demo,
    portfolio: data.portfolio || (demo ? demoPortfolio : undefined),
    projects: demo
      ? [
          ...data.projects,
          ...demoProjects.map((p, i) => ({ ...p, id: `demo-${i}` })),
        ]
      : data.projects,
    posts: demo
      ? [
          ...data.posts,
          { ...demoPost, id: "demo-post", publishedAt: new Date("2026-01-01") },
        ]
      : data.posts,
  };
}
