import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  icons: { icon: "/icon.svg" },
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: "A little corner of the internet",
    template: "%s · Portfolio",
  },
  description:
    "A personal collection of meaningful work, ideas, and experiences.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
