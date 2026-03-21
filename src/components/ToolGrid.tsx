"use client";

import { ToolRow } from "@/components/ToolCard";
import type { Tool } from "@/lib/types";

const COL_HEADERS = [
  { label: "Tool", width: "200px" },
  { label: "What it solves" },
  { label: "Stars", width: "72px" },
  { label: "Activity", width: "80px" },
  { label: "Version", width: "72px" },
  { label: "Installs", width: "80px" },
  { label: "", width: "48px" },
];

export function ToolTable({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-secondary)", fontSize: "14px" }}>
        No tools match these filters.
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid var(--border)" }}>
          {COL_HEADERS.map((col, i) => (
            <th
              key={i}
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
        {tools.map((tool) => (
          <ToolRow key={tool.id} tool={tool} />
        ))}
      </tbody>
    </table>
  );
}
