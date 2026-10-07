import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Your little studio",
  robots: { index: false, follow: false },
};
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await auth.api.getSession({ headers: await headers() })))
    redirect("/login");
  return children;
}
