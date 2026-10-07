import type { MetadataRoute } from "next";
import { publicContent } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { portfolio, projects, posts } = await publicContent();
  if (!portfolio) return [];
  const base = process.env.SITE_URL || "http://localhost:3000";
  return [
    "",
    "/projects",
    "/blog",
    ...projects.map((p) => `/projects/${p.slug}`),
    ...posts.map((p) => `/blog/${p.slug}`),
  ].map((path) => ({ url: base + path }));
}
