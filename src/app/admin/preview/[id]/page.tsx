import { adminPage } from "@/lib/admin-page";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Home, Header, Footer } from "@/components/site";
import { EntryPage } from "@/components/entry-page";
import { portfolioSchema, entrySchema } from "@/lib/schema";
import { publicContent } from "@/lib/content";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await adminPage();
  const doc = await db.document.findUnique({
    where: { id: (await params).id },
  });
  if (!doc) notFound();
  const published = await publicContent();
  const profile =
    doc.kind === "portfolio"
      ? portfolioSchema.parse(doc.draft)
      : published.portfolio;
  return (
    <>
      <div className="preview-banner">
        PRIVATE DRAFT PREVIEW · Only saved changes appear here.{" "}
        <Link href="/admin">← Back to studio</Link>
      </div>
      <Header name={profile?.name || "Preview"} />
      <main id="main">
        {doc.kind === "portfolio" ? (
          <Home
            profile={profile!}
            projects={published.projects}
            posts={published.posts}
          />
        ) : (
          <EntryPage entry={entrySchema.parse(doc.draft)} kind={doc.kind} />
        )}
      </main>
      <Footer name={profile?.name || "Preview"} />
    </>
  );
}
