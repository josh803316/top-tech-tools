"use client";

import { ToolCard } from "@/components/ToolCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import type { Tool } from "@/lib/types";

type ToolGridProps = {
  tools: Tool[];
  loading?: boolean;
};

const GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "16px",
};

export function ToolGrid({ tools, loading }: ToolGridProps) {
  if (loading) {
    return (
      <div style={GRID_STYLE}>
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 20px",
          color: "var(--text-secondary)",
          fontSize: "14px",
        }}
      >
        No tools found.
      </div>
    );
  }

  return (
    <div style={GRID_STYLE}>
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} />
      ))}
    </div>
  );
}
