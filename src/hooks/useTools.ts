"use client";

import useSWRInfinite from "swr/infinite";
import type { Tool, SortOption } from "@/lib/types";

type ToolsResponse = { items: Tool[]; nextCursor: string | null };

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTools(sort: SortOption, category: string, q: string) {
  const getKey = (pageIndex: number, prev: ToolsResponse | null) => {
    if (prev && !prev.nextCursor) return null;
    const params = new URLSearchParams();
    params.set("sort", sort);
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    if (prev?.nextCursor) params.set("cursor", prev.nextCursor);
    return `/api/tools?${params.toString()}`;
  };

  const { data, error, isLoading, size, setSize } = useSWRInfinite<ToolsResponse>(
    getKey,
    fetcher,
    { revalidateOnFocus: false }
  );

  const tools = data?.flatMap((d) => d.items) ?? [];
  const hasMore = data ? !!data[data.length - 1]?.nextCursor : false;

  return {
    tools,
    isLoading,
    error,
    hasMore,
    loadMore: () => setSize(size + 1),
  };
}
