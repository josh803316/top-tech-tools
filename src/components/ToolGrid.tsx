"use client";

import { ToolRow, ToolListItem, ToolCard } from "@/components/ToolCard";
import type { Tool } from "@/lib/types";
import type { ViewMode } from "@/lib/types";

const COL_HEADERS = [
  { label: "Tool",         width: "200px", cls: "" },
  { label: "What it solves",               cls: "" },
  { label: "Stars",        width: "72px",  cls: "col-optional" },
  { label: "Activity",     width: "80px",  cls: "col-optional" },
  { label: "Version",      width: "72px",  cls: "col-optional" },
  { label: "Installs",     width: "80px",  cls: "col-optional" },
  { label: "",             width: "48px",  cls: "col-optional" },
];

const EMPTY = (
  <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)", fontSize: "14px" }}>
    No tools match these filters.
  </div>
);

export function ToolTable({ tools, view = "cards" }: { tools: Tool[]; view?: ViewMode }) {
  if (tools.length === 0) return EMPTY;

  if (view === "cards") {
    return (
      <div
        className="cards-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "12px",
          padding: "16px",
        }}
      >
        {tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
      </div>
    );
  }

  if (view === "list") {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {tools.map((tool) => <ToolListItem key={tool.id} tool={tool} />)}
      </div>
    );
  }

  // table (default fallback)
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
          {COL_HEADERS.map((col, i) => (
            <th
              key={i}
              className={col.cls}
              style={{
                padding: i === 0 ? "8px 12px 8px 16px" : "8px 16px 8px 0",
                textAlign: "left",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                width: col.width,
                whiteSpace: "nowrap",
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tools.map((tool) => <ToolRow key={tool.id} tool={tool} />)}
      </tbody>
    </table>
  );
}
