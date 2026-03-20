import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { getAllCategories } from "@/lib/queries/tools";

export const metadata: Metadata = {
  title: "Top Tech Tools — The Complete Developer Ecosystem",
  description: "Discover and rank the best tools in the entire tech stack — AI models, editors, terminals, cloud platforms, container tools, and more.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getAllCategories();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <Header />
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <Suspense fallback={<div style={{ width: "var(--sidebar-width)", flexShrink: 0, background: "var(--surface)", borderRight: "1px solid var(--border)" }} />}>
              <Sidebar categories={categories} />
            </Suspense>
            <main
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
