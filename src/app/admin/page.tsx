import { adminPage } from "@/lib/admin-page";
import { db } from "@/lib/db";
import { Dashboard } from "@/components/dashboard";
export default async function Page() {
  const session = await adminPage();
  const docs = await db.document.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <Dashboard
      initial={JSON.parse(JSON.stringify(docs))}
      user={session!.user.name}
    />
  );
}
