"use client";

import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search, FolderOpen, GitBranch, Terminal, FileText,
  Cpu, Wifi, Zap, Box, Settings, HelpCircle,
  Sparkles, Bot, Code, Monitor, Hash, Cloud, Layers,
  Package, GitCommit,
} from "lucide-react";
import type { Category } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = {
  Search, FolderOpen, GitBranch, Terminal, FileText,
  Cpu, Wifi, Zap, Box,
  Sparkles, Bot, Code, Monitor, Hash, Cloud, Layers,
  Package, GitCommit,
};

type SidebarProps = {
  categories: Category[];
};

export function Sidebar({ categories }: SidebarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeCategory = searchParams.get("category") ?? "";

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
      {/* Section header */}
      <div style={{ padding: "20px 16px 12px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-secondary)",
            marginBottom: "3px",
          }}
        >
          Categories
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          Browse by function
        </div>
      </div>

      {/* Category list */}
      <nav style={{ padding: "0 8px", flex: 1 }}>
        {categories.map((cat) => {
          const Icon = ICONS[cat.iconName] ?? Terminal;
          const isActive = activeCategory === cat.slug && pathname === "/";
          return (
            <Link
              key={cat.slug}
              href={`/?category=${cat.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "7px",
                marginBottom: "2px",
                fontSize: "13px",
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive ? "var(--accent-dim)" : "transparent",
                border: isActive ? "1px solid rgba(79,131,255,0.25)" : "1px solid transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                }
              }}
            >
              <Icon
                size={15}
                color={isActive ? "var(--accent)" : "currentColor"}
              />
              {cat.label}
            </Link>
          );
        })}
      </nav>

      {/* Pro Access */}
      <div style={{ padding: "12px 12px 4px" }}>
        <div
          style={{
            background: "rgba(79,131,255,0.08)",
            border: "1px solid rgba(79,131,255,0.2)",
            borderRadius: "10px",
            padding: "14px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "6px",
            }}
          >
            Pro Access
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "10px" }}>
            Get advanced analytics and early tool access.
          </p>
          <button
            style={{
              width: "100%",
              padding: "7px",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "8px 8px 12px" }}>
        {[
          { icon: Settings, label: "Settings" },
          { icon: HelpCircle, label: "Support" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "7px 10px",
              borderRadius: "7px",
              fontSize: "12px",
              color: "var(--text-muted)",
              cursor: "pointer",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            <Icon size={13} />
            {label}
          </div>
        ))}
      </div>
    </aside>
  );
}
