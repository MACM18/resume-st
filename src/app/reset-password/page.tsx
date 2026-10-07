import { LoginForm } from "@/components/login-form";
export const metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <LoginForm token={(await searchParams).token} />;
}
