import { notFound } from "next/navigation";
import { siteData } from "@/lib/site-data";
import { EntryPage } from "@/components/entry-page";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = (await siteData()).posts.find((p) => p.slug === slug);
  return {
    title: e?.seoTitle || e?.title,
    description: e?.seoDescription || e?.excerpt,
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const e = (await siteData()).posts.find((p) => p.slug === slug);
  if (!e) notFound();
  return <EntryPage entry={e} kind="post" />;
}
