import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spanish German Vocabulary Trainer",
  description: "Offline Spanish–German vocabulary practice with CSV import and speech.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head><meta name="theme-color" content="#f3f0e7" /><meta name="mobile-web-app-capable" content="yes" /></head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
