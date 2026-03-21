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
  { value: "", label: "Any" },
  { value: "elite", label: "Elite 10k+" },
  { value: "high", label: "High 1k+" },
  { value: "mid", label: "Mid 100+" },
  { value: "low", label: "Low" },
];

const ACTIVITY_OPTIONS = [
  { value: "", label: "Any" },
  { value: "hot", label: "Hot <7d" },
  { value: "active", label: "Active <30d" },
  { value: "recent", label: "Recent <90d" },
  { value: "stale", label: "Stale" },
];

const SORT_OPTIONS = [
  { value: "stars", label: "Stars" },
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "installs", label: "Installs" },
];

type SidebarProps = { categories: Category[] };

export function Sidebar({ categories }: SidebarProps) {
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
            All categories
          </Link>
          {categories.map((cat) => {
            const Icon = ICONS[cat.iconName] ?? Terminal;
            const active = activeCategory === cat.slug;
            return (
              <a
                key={cat.slug}
                href="#"
                onClick={(e) => { e.preventDefault(); update({ category: active ? "" : cat.slug }); }}
                style={catRowStyle(active)}
              >
                <Icon size={13} />
                {cat.label}
              </a>
            );
          })}
        </nav>
      </Section>

      <Divider />

      {/* Quality */}
      <Section label="Quality">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ quality: opt.value })}
              style={chipStyle(activeQuality === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <Divider />

      {/* Activity */}
      <Section label="Activity">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {ACTIVITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update({ activity: opt.value })}
              style={chipStyle(activeActivity === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      <div style={{ flex: 1 }} />
    </aside>
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
