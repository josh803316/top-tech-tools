"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import {
  Search, FolderOpen, GitBranch, Terminal, FileText,
  Cpu, Wifi, Zap, Box,
} from "lucide-react";
import type { Category, Tool } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = {
  Search, FolderOpen, GitBranch, Terminal, FileText,
  Cpu, Wifi, Zap, Box,
};

function formatStars(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

type LeaderboardCardProps = {
  category: Category;
  tools: Tool[];
};

export function LeaderboardCard({ category, tools }: LeaderboardCardProps) {
  const Icon = ICONS[category.iconName] ?? Terminal;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 18px 12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "var(--accent-dim)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={14} color="var(--accent)" />
          </div>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {category.label}
          </span>
        </div>
        <span
          style={{
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          Weekly Pulse
        </span>
      </div>

      {/* Blue dashed divider */}
      <div
        style={{
          height: "1px",
          margin: "0 18px",
          borderTop: "1px dashed var(--border-blue)",
        }}
      />

      {/* Tool rows */}
      <div style={{ flex: 1 }}>
        {tools.map((tool, i) => (
          <Link
            key={tool.id}
            href={`/tool/${tool.slug}`}
            style={{ display: "block" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px 18px",
                borderBottom: i < tools.length - 1 ? "1px dashed var(--border-blue)" : "none",
                transition: "background 0.12s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(79,131,255,0.04)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {/* Rank number */}
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  lineHeight: 1,
                  minWidth: "28px",
                  paddingTop: "1px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Tool info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    marginBottom: "3px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {tool.name}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "12px",
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    <Star size={11} fill="currentColor" />
                    {formatStars(tool.stars)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.4,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {tool.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer CTA */}
      <Link
        href={`/?category=${category.slug}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "11px 18px",
          background: "rgba(255,255,255,0.02)",
          borderTop: "1px solid var(--border)",
          fontSize: "10px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
          transition: "color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
        }}
      >
        View all {category.label}
      </Link>
    </div>
  );
}
