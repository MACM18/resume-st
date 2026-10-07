import "dotenv/config";
import { db } from "../src/lib/db";
import { demoPortfolio, demoProjects, demoPost } from "../src/lib/demo";
await db.document.upsert({
  where: { id: "portfolio" },
  create: { id: "portfolio", kind: "portfolio", draft: demoPortfolio },
  update: {},
});
if (process.env.SEED_DEMO === "true") {
  for (const [i, entry] of demoProjects.entries())
    await db.document.upsert({
      where: { id: `demo-project-${i}` },
      create: { id: `demo-project-${i}`, kind: "project", draft: entry },
      update: {},
    });
  await db.document.upsert({
    where: { id: "demo-post" },
    create: { id: "demo-post", kind: "post", draft: demoPost },
    update: {},
  });
}
console.log("Draft content initialized. Nothing was published.");
await db.$disconnect();
