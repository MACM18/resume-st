import { LoginForm } from "@/components/login-form";
export const metadata = {
  title: "Studio sign in",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <LoginForm />;
}
