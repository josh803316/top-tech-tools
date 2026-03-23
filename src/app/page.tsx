import { getTools } from "@/lib/queries/tools";
import { ToolTable } from "@/components/ToolGrid";
import { Toolbar } from "@/components/Toolbar";
import { Suspense } from "react";
import type { SortOption, QualityLevel, ActivityLevel, ViewMode } from "@/lib/types";

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
  const view = (params.view ?? "cards") as ViewMode;

  const { items: tools } = await getTools({
    sort,
    category: params.category,
    q: params.q,
    quality: params.quality as QualityLevel | undefined,
    activity: params.activity as ActivityLevel | undefined,
    letter: params.letter,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Suspense fallback={<div style={{ height: "54px", borderBottom: "1px solid var(--border)" }} />}>
        <Toolbar active={view} total={tools.length} />
      </Suspense>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <ToolTable tools={tools} view={view} />
      </div>
    </div>
  );
}
