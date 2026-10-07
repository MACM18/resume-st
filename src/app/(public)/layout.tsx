export const dynamic = "force-dynamic";
import { Header, Footer, DemoBanner } from "@/components/site";
import { siteData } from "@/lib/site-data";
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const d = await siteData();
  return (
    <>
      {d.demo && <DemoBanner />}
      <Header name={d.portfolio?.name || "hello"} />
      <main id="main">{children}</main>
      <Footer name={d.portfolio?.name || "Portfolio"} />
    </>
  );
}
