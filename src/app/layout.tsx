import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { LayoutShell } from "@/components/LayoutShell";
import { getAllCategories, getFilterCounts } from "@/lib/queries/tools";

export const metadata: Metadata = {
  title: "Top Tech Tools — The Complete Developer Ecosystem",
  description: "Discover and rank the best tools in the entire tech stack — AI models, editors, terminals, cloud platforms, container tools, and more.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categories, counts] = await Promise.all([getAllCategories(), getFilterCounts()]);

  const sidebar = (
    <Suspense fallback={<div style={{ width: "var(--sidebar-width)", background: "var(--surface)" }} />}>
      <Sidebar categories={categories} counts={counts} />
    </Suspense>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <Header />
          <LayoutShell sidebar={sidebar}>
            {children}
          </LayoutShell>
        </div>
      </body>
    </html>
  );
}
