"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Terminal } from "lucide-react";
import {
  Search, FolderOpen, GitBranch, FileText,
  Cpu, Wifi, Zap, Box, Sparkles, Bot, Code, Monitor,
  Hash, Cloud, Layers, Package, GitCommit,
} from "lucide-react";
import type { Category } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = {
  Search, FolderOpen, GitBranch, Terminal, FileText,
  Cpu, Wifi, Zap, Box, Sparkles, Bot, Code, Monitor,
  Hash, Cloud, Layers, Package, GitCommit,
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const QUALITY_OPTIONS = [
  { value: "elite", label: "Elite 10k+" },
  { value: "high", label: "High 1k–10k" },
  { value: "mid", label: "Mid 100–1k" },
  { value: "low", label: "Low <100" },
];

const ACTIVITY_OPTIONS = [
  { value: "hot", label: "Hot <7d" },
  { value: "active", label: "Active <30d" },
  { value: "recent", label: "Recent <90d" },
  { value: "stale", label: "Stale 90d+" },
];

const SORT_OPTIONS = [
  { value: "stars", label: "Stars" },
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "installs", label: "Installs" },
];

type FilterCounts = {
  categories: Record<string, number>;
  quality: Record<string, number>;
  activity: Record<string, number>;
};

type SidebarProps = {
  categories: Category[];
  counts: FilterCounts;
};

export function Sidebar({ categories, counts }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const get = (key: string) => searchParams.get(key) ?? "";

  const update = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      params.delete("cursor");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const activeCategory = get("category");
  const activeSort = get("sort") || "stars";
  const activeLetter = get("letter");
  const activeQuality = get("quality");
  const activeActivity = get("activity");

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        height: "100%",
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px 10px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>
          Filters
        </span>
      </div>

      {/* Category */}
      <Section label="Category">
        <CheckRow
          label="All"
          checked={!activeCategory}
          count={Object.values(counts.categories).reduce((a, b) => a + b, 0)}
          onClick={() => update({ category: "" })}
        />
        {categories.map((cat) => {
          const checked = activeCategory === cat.slug;
          return (
            <CheckRow
              key={cat.slug}
              label={cat.label}
              checked={checked}
              count={counts.categories[cat.slug] ?? 0}
              onClick={() => update({ category: checked ? "" : cat.slug })}
            />
          );
        })}
      </Section>

      <Divider />

      {/* Quality */}
      <Section label="Quality">
        {QUALITY_OPTIONS.map((opt) => {
          const checked = activeQuality === opt.value;
          return (
            <CheckRow
              key={opt.value}
              label={opt.label}
              checked={checked}
              count={counts.quality[opt.value] ?? 0}
              onClick={() => update({ quality: checked ? "" : opt.value })}
            />
          );
        })}
      </Section>

      <Divider />

      {/* Activity */}
      <Section label="Activity">
        {ACTIVITY_OPTIONS.map((opt) => {
          const checked = activeActivity === opt.value;
          return (
            <CheckRow
              key={opt.value}
              label={opt.label}
              checked={checked}
              count={counts.activity[opt.value] ?? 0}
              onClick={() => update({ activity: checked ? "" : opt.value })}
            />
          );
        })}
      </Section>

      <Divider />

      {/* Sort */}
      <Section label="Sort by">
        {SORT_OPTIONS.map((opt) => {
          const checked = activeSort === opt.value;
          return (
            <CheckRow
              key={opt.value}
              label={opt.label}
              checked={checked}
              count={null}
              onClick={() => update({ sort: opt.value === "stars" ? "" : opt.value })}
              radio
            />
          );
        })}
      </Section>

      <Divider />

      {/* A–Z */}
      <Section label="A – Z">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
          <button onClick={() => update({ letter: "" })} style={letterStyle(!activeLetter)}>
            All
          </button>
          {LETTERS.map((l) => (
            <button
              key={l}
              onClick={() => update({ letter: activeLetter === l.toLowerCase() ? "" : l.toLowerCase() })}
              style={letterStyle(activeLetter === l.toLowerCase())}
            >
              {l}
            </button>
          ))}
        </div>
      </Section>

      <div style={{ flex: 1 }} />
    </aside>
  );
}

function CheckRow({
  label,
  checked,
  count,
  onClick,
  radio = false,
}: {
  label: string;
  checked: boolean;
  count: number | null;
  onClick: () => void;
  radio?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "4px 2px",
        cursor: "pointer",
        borderRadius: "4px",
      }}
    >
      <input
        type={radio ? "radio" : "checkbox"}
        checked={checked}
        onChange={onClick}
        style={{
          accentColor: "var(--accent)",
          width: "13px",
          height: "13px",
          flexShrink: 0,
          cursor: "pointer",
        }}
      />
      <span
        style={{
          flex: 1,
          fontSize: "12px",
          color: checked ? "var(--text-primary)" : "var(--text-secondary)",
          fontWeight: checked ? 500 : 400,
        }}
      >
        {label}
      </span>
      {count !== null && (
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
          {count}
        </span>
      )}
    </label>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 16px" }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: "var(--border)", margin: "0 16px" }} />;
}

function letterStyle(active: boolean): React.CSSProperties {
  return {
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    border: `1px solid ${active ? "rgba(79,131,255,0.4)" : "transparent"}`,
    background: active ? "rgba(79,131,255,0.12)" : "transparent",
    color: active ? "var(--accent)" : "var(--text-secondary)",
    fontSize: "10px",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.1s",
  };
}
