"use client";

import { Star, GitFork, ExternalLink, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Tool } from "@/lib/types";
import Link from "next/link";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

type ToolCardProps = {
  tool: Tool;
};

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      href={`/tool/${tool.slug}`}
      style={{ textDecoration: "none" }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "20px",
          cursor: "pointer",
          transition: "background 0.15s, border-color 0.15s, transform 0.1s",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--surface-hover)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "var(--surface)";
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", minWidth: 0 }}>
            <span
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
              }}
            >
              {tool.name}
            </span>
            {tool.featured && (
              <Badge variant="featured">featured</Badge>
            )}
          </div>
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            {tool.categories.slice(0, 2).map((cat) => (
              <Badge key={cat.slug} variant="category">{cat.label}</Badge>
            ))}
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "13px",
            lineHeight: "1.5",
            margin: 0,
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {tool.description}
        </p>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginTop: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--text-secondary)",
              fontSize: "12px",
            }}
          >
            <Star size={12} fill="currentColor" />
            <span>{formatNumber(tool.stars)}</span>
          </div>
          {tool.installsLast30d > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                color: "var(--text-secondary)",
                fontSize: "12px",
              }}
            >
              <Package size={12} />
              <span>{formatNumber(tool.installsLast30d)}/mo</span>
            </div>
          )}
          {tool.currentVersion && (
            <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
              v{tool.currentVersion}
            </span>
          )}

          {/* Links */}
          <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
            {tool.githubUrl && (
              <a
                href={tool.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: "var(--text-secondary)",
                  transition: "color 0.15s",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
                title="GitHub"
              >
                <GitFork size={14} />
              </a>
            )}
            {tool.brewUrl && (
              <a
                href={tool.brewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: "var(--text-secondary)",
                  transition: "color 0.15s",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
                title="Homebrew"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
