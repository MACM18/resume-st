export const dynamic = "force-dynamic";
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/reset-password", "/api/"],
    },
    sitemap: `${process.env.SITE_URL || "http://localhost:3000"}/sitemap.xml`,
  };
}
