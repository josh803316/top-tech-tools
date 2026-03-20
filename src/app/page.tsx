import { Suspense } from "react";
import { getTopToolsByCategory, getTools, getAllCategories } from "@/lib/queries/tools";
import { LeaderboardCard } from "@/components/LeaderboardCard";
import { ToolGrid } from "@/components/ToolGrid";
import type { SortOption } from "@/lib/types";

export const revalidate = 3600;

type SearchParams = { sort?: string; category?: string; q?: string };

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const sort = (params.sort ?? "stars") as SortOption;
  const category = params.category;
  const q = params.q;

  // Category filter view
  if (category || q) {
    const [{ items: tools }, allCategories] = await Promise.all([
      getTools({ sort, category, q }),
      getAllCategories(),
    ]);
    const cat = allCategories.find((c) => c.slug === category);

    return (
      <div style={{ padding: "32px 32px 64px" }}>
        <div style={{ marginBottom: "28px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "8px",
            }}
          >
            {q ? "Search Results" : "Category Filter"}
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: "6px",
            }}
          >
            {q ? `"${q}"` : cat?.label ?? category}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            {tools.length} tools · sorted by{" "}
            {sort === "stars" ? "GitHub stars" : sort === "trending" ? "trending" : sort === "newest" ? "newest" : "install count"}
          </p>
        </div>
        <ToolGrid tools={tools} />
      </div>
    );
  }

  // Leaderboard home
  const leaderboard = await getTopToolsByCategory(3);

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "10px",
          }}
        >
          Global Standings
        </div>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
            marginBottom: "8px",
            lineHeight: 1.1,
          }}
        >
          Tool Leaderboards
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "540px", lineHeight: 1.5 }}>
          Real-time performance rankings based on community adoption, star growth, and architectural stability.
        </p>
      </div>

      {/* Leaderboard grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "16px",
        }}
      >
        {leaderboard.map(({ category, tools }) => (
          <LeaderboardCard key={category.slug} category={category} tools={tools} />
        ))}
      </div>
    </div>
  );
}
