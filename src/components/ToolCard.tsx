"use client";

import { Star, GitFork, AlertCircle, Package, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Tool } from "@/lib/types";

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function activityInfo(lastPushedAt: string | null): { label: string; color: string; bg: string } {
  if (!lastPushedAt) return { label: "unknown", color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)" };
  const days = (Date.now() - new Date(lastPushedAt).getTime()) / 86400000;
  if (days < 7)  return { label: "hot",    color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
  if (days < 30) return { label: "active", color: "#4f83ff", bg: "rgba(79,131,255,0.12)" };
  if (days < 90) return { label: "recent", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  return           { label: "stale",  color: "#ef4444", bg: "rgba(239,68,68,0.10)" };
}

function starRating(stars: number): number {
  if (stars >= 50_000) return 5;
  if (stars >= 10_000) return 4;
  if (stars >= 5_000)  return 3;
  if (stars >= 1_000)  return 2;
  return 1;
}

function toolAge(createdAt: string): string {
  const years = Math.floor((Date.now() - new Date(createdAt).getTime()) / (365.25 * 86400000));
  if (years < 1) return "<1y old";
  return `${years}y old`;
}

function Stars({ n }: { n: number }) {
  const filled = starRating(n);
  return (
    <span style={{ color: "#f59e0b", letterSpacing: "1px", fontSize: "13px" }}>
      {"★".repeat(filled)}{"☆".repeat(5 - filled)}
    </span>
  );
}

// ─── Rich Card (default/cards view) ─────────────────────────────────────────

export function ToolCard({ tool }: { tool: Tool }) {
  const activity = activityInfo(tool.lastPushedAt);

  return (
    <Link
      href={`/tool/${tool.slug}`}
      className="card-hover"
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        textDecoration: "none",
        transition: "border-color 0.15s",
        gap: "12px",
      }}
    >
      {/* Header: name + activity badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            {tool.name}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>
            {tool.categories[0]?.label ?? ""}
            {tool.githubTopics[0] ? ` · ${tool.githubTopics[0]}` : ""}
          </div>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: activity.color,
            background: activity.bg,
            borderRadius: "5px",
            padding: "2px 8px",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {activity.label}
        </span>
      </div>

      {/* Stats grid: 2 columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 0" }}>
        <StatCell icon={<Star size={12} fill="currentColor" color="#f59e0b" />} label={`${fmt(tool.stars)} stars`} />
        <StatCell icon={<GitFork size={12} color="var(--text-muted)" />} label={`${fmt(tool.forks)} forks`} />
        <StatCell icon={<AlertCircle size={12} color="#ef4444" />} label={`${fmt(tool.openIssues)} open`} highlight="red" />
        {tool.installsLast30d > 0
          ? <StatCell icon={<Package size={12} color="var(--text-muted)" />} label={`${fmt(tool.installsLast30d)}/mo`} />
          : <StatCell icon={null} label={tool.currentVersion ? `v${tool.currentVersion}` : ""} muted />
        }
        <StatCell icon={null} label={toolAge(tool.createdAt)} muted />
        {tool.featured && <StatCell icon={null} label="featured" accent />}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "10px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {tool.githubUrl && (
            <a
              href={tool.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: "var(--text-muted)", fontSize: "11px", display: "flex", alignItems: "center", gap: "3px", textDecoration: "none" }}
            >
              <ExternalLink size={11} />
              GitHub
            </a>
          )}
        </div>
        <Stars n={tool.stars} />
      </div>
    </Link>
  );
}

function StatCell({
  icon,
  label,
  highlight,
  muted,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: "red";
  muted?: boolean;
  accent?: boolean;
}) {
  if (!label) return <div />;
  const color = highlight === "red"
    ? "#ef4444"
    : accent
    ? "var(--accent)"
    : muted
    ? "var(--text-muted)"
    : "var(--text-secondary)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color }}>
      {icon}
      {label}
    </div>
  );
}

// ─── List item (compact single-row) ─────────────────────────────────────────

export function ToolListItem({ tool }: { tool: Tool }) {
  const activity = activityInfo(tool.lastPushedAt);
  return (
    <Link
      href={`/tool/${tool.slug}`}
      className="row-hover"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "9px 16px",
        borderBottom: "1px solid var(--border)",
        textDecoration: "none",
      }}
    >
      <div style={{ width: "180px", flexShrink: 0 }}>
        <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {tool.name}
        </span>
        {tool.featured && (
          <span style={{ marginLeft: "6px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", verticalAlign: "middle" }}>
            featured
          </span>
        )}
      </div>
      <p style={{ flex: 1, fontSize: "12px", color: "var(--text-secondary)", margin: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
        {tool.description}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "11px", width: "52px", justifyContent: "flex-end" }}>
          <Star size={10} fill="currentColor" />
          {fmt(tool.stars)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", width: "52px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activity.color, flexShrink: 0 }} />
          <span style={{ color: activity.color, fontWeight: 500 }}>{activity.label}</span>
        </div>
        {tool.categories[0] && (
          <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {tool.categories[0].label}
          </span>
        )}
      </div>
    </Link>
  );
}

// ─── Table row ───────────────────────────────────────────────────────────────

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
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {tool.description}
          </p>
        </Link>
      </td>
      {/* Stars */}
      <td className="col-optional" style={{ padding: "10px 16px 10px 0", verticalAlign: "middle", width: "72px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "12px" }}>
          <Star size={11} fill="currentColor" />
          {fmt(tool.stars)}
        </div>
      </td>
      {/* Activity */}
      <td className="col-optional" style={{ padding: "10px 16px 10px 0", verticalAlign: "middle", width: "80px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: activity.color, flexShrink: 0 }} />
          <span style={{ color: activity.color, fontWeight: 500 }}>{activity.label}</span>
        </div>
      </td>
      {/* Version */}
      <td className="col-optional" style={{ padding: "10px 16px 10px 0", verticalAlign: "middle", width: "72px", whiteSpace: "nowrap" }}>
        {tool.currentVersion ? (
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "monospace" }}>
            v{tool.currentVersion}
          </span>
        ) : null}
      </td>
      {/* Installs */}
      <td className="col-optional" style={{ padding: "10px 16px 10px 0", verticalAlign: "middle", width: "80px", whiteSpace: "nowrap" }}>
        {tool.installsLast30d > 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)", fontSize: "11px" }}>
            <Package size={10} />
            {fmt(tool.installsLast30d)}/mo
          </div>
        ) : null}
      </td>
      {/* Links */}
      <td className="col-optional" style={{ padding: "10px 16px 10px 0", verticalAlign: "middle", width: "48px" }}>
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
