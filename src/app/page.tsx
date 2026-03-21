import { getTools } from "@/lib/queries/tools";
import { ToolTable } from "@/components/ToolGrid";
import type { SortOption, QualityLevel, ActivityLevel } from "@/lib/types";

export const revalidate = 3600;

type SearchParams = {
  sort?: string;
  category?: string;
  q?: string;
  quality?: string;
  activity?: string;
  letter?: string;
};

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const sort = (params.sort ?? "stars") as SortOption;

  const { items: tools } = await getTools({
    sort,
    category: params.category,
    q: params.q,
    quality: params.quality as QualityLevel | undefined,
    activity: params.activity as ActivityLevel | undefined,
    letter: params.letter,
  });

  const hasFilters = params.category || params.q || params.quality || params.activity || params.letter;

  return (
    <div style={{ padding: "24px 0 64px" }}>
      {/* Page header */}
      <div style={{ padding: "0 24px 20px" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)", marginBottom: "4px" }}>
          {hasFilters ? "Filtered results" : "All tools"}
        </h1>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
          {tools.length} tools · sorted by {sort === "stars" ? "GitHub stars" : sort === "trending" ? "trending score" : sort === "newest" ? "newest" : "install count"}
        </p>
      </div>

      <ToolTable tools={tools} />
    </div>
  );
}
