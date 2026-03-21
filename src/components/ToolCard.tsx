"use client";

import { Star, Package, GitFork, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Tool } from "@/lib/types";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function activityInfo(lastPushedAt: string | null): { label: string; color: string } {
  if (!lastPushedAt) return { label: "unknown", color: "var(--text-muted)" };
  const days = (Date.now() - new Date(lastPushedAt).getTime()) / 86400000;
  if (days < 7) return { label: "hot", color: "#22c55e" };
  if (days < 30) return { label: "active", color: "#4f83ff" };
  if (days < 90) return { label: "recent", color: "#f59e0b" };
  return { label: "stale", color: "var(--text-muted)" };
}

export function ToolRow({ tool }: { tool: Tool }) {
  const activity = activityInfo(tool.lastPushedAt);

  return (
    <tr className="row-hover" style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
      {/* Name + category */}
      <td style={{ padding: "10px 12px 10px 16px", verticalAlign: "middle", width: "200px" }}>
        <Link href={`/tool/${tool.slug}`} style={{ textDecoration: "none" }}>
          <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: "3px" }}>
            {tool.name}
            {tool.featured && (
              <span style={{ marginLeft: "6px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", verticalAlign: "middle" }}>
                featured
              </span>
            )}
          </div>
          {tool.categories[0] && (
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {tool.categories[0].label}
            </div>
          )}
        </Link>
      </td>

      {/* Description */}
      <td style={{ padding: "10px 16px 10px 0", verticalAlign: "middle" }}>
        <Link href={`/tool/${tool.slug}`} style={{ textDecoration: "none" }}>
          <p style={{
            fontSize: "12px",
            color: "var(--text-secondary)",
            lineHeight: 1.5,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {tool.description}
          </p>
        </Link>
      </td>

      {/* Stars */}
      <td style={{ padding: "10px 16px 10px 0", verticalAlign: "middle", width: "72px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "12px" }}>
          <Star size={11} fill="currentColor" />
          {fmt(tool.stars)}
        </div>
      </td>

      {/* Activity */}
      <td style={{ padding: "10px 16px 10px 0", verticalAlign: "middle", width: "80px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activity.color, flexShrink: 0 }} />
          <span style={{ color: activity.color, fontWeight: 500 }}>{activity.label}</span>
        </div>
      </td>

      {/* Version */}
      <td style={{ padding: "10px 16px 10px 0", verticalAlign: "middle", width: "72px", whiteSpace: "nowrap" }}>
        {tool.currentVersion ? (
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
            v{tool.currentVersion}
          </span>
        ) : null}
      </td>

      {/* Installs */}
      <td style={{ padding: "10px 16px 10px 0", verticalAlign: "middle", width: "80px", whiteSpace: "nowrap" }}>
        {tool.installsLast30d > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "11px" }}>
            <Package size={10} />
            {fmt(tool.installsLast30d)}/mo
          </div>
        ) : null}
      </td>

      {/* Links */}
      <td style={{ padding: "10px 16px 10px 0", verticalAlign: "middle", width: "48px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {tool.githubUrl && (
            <a href={tool.githubUrl} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", transition: "color 0.12s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
            >
              <GitFork size={13} />
            </a>
          )}
          {tool.websiteUrl && (
            <a href={tool.websiteUrl} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", transition: "color 0.12s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}
