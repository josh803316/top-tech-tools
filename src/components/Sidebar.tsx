"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useRef } from "react";
import {
  Search, FolderOpen, GitBranch, Terminal, FileText,
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
  { value: "elite", label: "Elite", sublabel: "10k+" },
  { value: "high", label: "High", sublabel: "1k+" },
  { value: "mid", label: "Mid", sublabel: "100+" },
  { value: "low", label: "Low", sublabel: "<100" },
];

const ACTIVITY_OPTIONS = [
  { value: "hot", label: "Hot", sublabel: "<7d" },
  { value: "active", label: "Active", sublabel: "<30d" },
  { value: "recent", label: "Recent", sublabel: "<90d" },
  { value: "stale", label: "Stale", sublabel: "90d+" },
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
  const inputRef = useRef<HTMLInputElement>(null);

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
        gap: 0,
      }}
    >
      {/* Search */}
      <div style={{ padding: "14px 12px 10px" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: inputRef.current?.value ?? "" });
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "7px",
              padding: "7px 10px",
            }}
          >
            <Search size={13} color="var(--text-secondary)" />
            <input
              ref={inputRef}
              defaultValue={get("q")}
              placeholder="Search tools…"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: "13px",
                width: "100%",
              }}
            />
          </div>
        </form>
      </div>

      <Divider />

      {/* Sort */}
      <Section label="Sort by">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ sort: opt.value === "stars" ? "" : opt.value })}
              style={chipStyle(activeSort === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Divider />

      {/* A–Z */}
      <Section label="A – Z">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
          <button
            onClick={() => update({ letter: "" })}
            style={letterStyle(!activeLetter)}
          >
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

      <Divider />

      {/* Category */}
      <Section label="Category">
        <nav style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <Link
            href={pathname === "/" ? "/" : `/?`}
            onClick={(e) => { e.preventDefault(); update({ category: "" }); }}
            style={catRowStyle(!activeCategory)}
          >
            <FolderOpen size={13} />
            <span style={{ flex: 1 }}>All categories</span>
          </Link>
          {categories.map((cat) => {
            const Icon = ICONS[cat.iconName] ?? Terminal;
            const active = activeCategory === cat.slug;
            const count = counts.categories[cat.slug];
            return (
              <a
                key={cat.slug}
                href="#"
                onClick={(e) => { e.preventDefault(); update({ category: active ? "" : cat.slug }); }}
                style={catRowStyle(active)}
              >
                <Icon size={13} />
                <span style={{ flex: 1 }}>{cat.label}</span>
                {count !== undefined && (
                  <CountBadge value={count} active={active} />
                )}
              </a>
            );
          })}
        </nav>
      </Section>

      <Divider />

      {/* Quality */}
      <Section label="Quality">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {QUALITY_OPTIONS.map((opt) => {
            const active = activeQuality === opt.value;
            const count = counts.quality[opt.value];
            return (
              <button
                key={opt.value}
                onClick={() => update({ quality: active ? "" : opt.value })}
                style={facetRowStyle(active)}
              >
                <span style={{ flex: 1, textAlign: "left" }}>
                  {opt.label}
                  <span style={{ marginLeft: "5px", fontSize: "10px", color: active ? "rgba(79,131,255,0.7)" : "var(--text-muted)" }}>
                    {opt.sublabel}
                  </span>
                </span>
                {count !== undefined && <CountBadge value={count} active={active} />}
              </button>
            );
          })}
        </div>
      </Section>

      <Divider />

      {/* Activity */}
      <Section label="Activity">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {ACTIVITY_OPTIONS.map((opt) => {
            const active = activeActivity === opt.value;
            const count = counts.activity[opt.value];
            return (
              <button
                key={opt.value}
                onClick={() => update({ activity: active ? "" : opt.value })}
                style={facetRowStyle(active)}
              >
                <span style={{ flex: 1, textAlign: "left" }}>
                  {opt.label}
                  <span style={{ marginLeft: "5px", fontSize: "10px", color: active ? "rgba(79,131,255,0.7)" : "var(--text-muted)" }}>
                    {opt.sublabel}
                  </span>
                </span>
                {count !== undefined && <CountBadge value={count} active={active} />}
              </button>
            );
          })}
        </div>
      </Section>

      <div style={{ flex: 1 }} />
    </aside>
  );
}

function CountBadge({ value, active }: { value: number; active: boolean }) {
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 500,
        color: active ? "var(--accent)" : "var(--text-muted)",
        background: active ? "rgba(79,131,255,0.12)" : "rgba(255,255,255,0.04)",
        borderRadius: "4px",
        padding: "1px 5px",
        minWidth: "24px",
        textAlign: "center",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
    </span>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "10px 12px" }}>
      <div
        style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.12em",
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
  return <div style={{ height: "1px", background: "var(--border)", margin: "0 12px" }} />;
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: "4px 9px",
    borderRadius: "5px",
    border: `1px solid ${active ? "rgba(79,131,255,0.4)" : "var(--border)"}`,
    background: active ? "rgba(79,131,255,0.12)" : "transparent",
    color: active ? "var(--accent)" : "var(--text-secondary)",
    fontSize: "11px",
    fontWeight: active ? 500 : 400,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "all 0.12s",
  };
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

function catRowStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "5px 7px",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: active ? 500 : 400,
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    background: active ? "var(--accent-dim)" : "transparent",
    cursor: "pointer",
    transition: "all 0.12s",
    textDecoration: "none",
  };
}

function facetRowStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "5px 7px",
    borderRadius: "5px",
    fontSize: "12px",
    fontWeight: active ? 500 : 400,
    color: active ? "var(--text-primary)" : "var(--text-secondary)",
    background: active ? "var(--accent-dim)" : "transparent",
    border: "none",
    cursor: "pointer",
    transition: "all 0.12s",
    width: "100%",
  };
}
