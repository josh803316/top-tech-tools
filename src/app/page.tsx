import { getTools } from "@/lib/queries/tools";
import { ToolTable } from "@/components/ToolGrid";
import { ViewToggle } from "@/components/ViewToggle";
import { Suspense } from "react";
import type { SortOption, QualityLevel, ActivityLevel } from "@/lib/types";
import type { ViewMode } from "@/components/ViewToggle";

export const revalidate = 3600;

type SearchParams = {
  sort?: string;
  category?: string;
  q?: string;
  quality?: string;
  activity?: string;
  letter?: string;
  view?: string;
};

export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const sort = (params.sort ?? "stars") as SortOption;
  const view = (params.view ?? "table") as ViewMode;

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
    <div style={{ padding: "0 0 64px", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {hasFilters ? "Filtered results" : "All tools"}
          </span>
          <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
            {tools.length} tools
          </span>
        </div>
        <Suspense fallback={null}>
          <ViewToggle active={view} />
        </Suspense>
      </div>

      <ToolTable tools={tools} view={view} />
    </div>
  );
}
