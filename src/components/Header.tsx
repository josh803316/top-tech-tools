"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Bell, ArrowUpRight } from "lucide-react";
import { Suspense } from "react";

function NavTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort");

  const tabs = [
    { label: "Explore", href: "/", active: pathname === "/" && sort !== "trending" },
    { label: "Trending", href: "/trending", active: pathname === "/trending" },
    { label: "Changelog", href: "/changelog", active: pathname === "/changelog" },
  ];

  return (
    <nav style={{ display: "flex", gap: "4px" }}>
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          style={{
            padding: "5px 14px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: tab.active ? 500 : 400,
            color: tab.active ? "var(--text-primary)" : "var(--text-secondary)",
            background: tab.active ? "rgba(255,255,255,0.08)" : "transparent",
            transition: "all 0.15s",
          }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function Header() {
  return (
    <header
      style={{
        height: "var(--header-height)",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "20px",
        flexShrink: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <Link
        href="/"
        style={{
          fontWeight: 700,
          fontSize: "13px",
          letterSpacing: "0.08em",
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          textTransform: "uppercase",
          fontFamily: "monospace",
          width: "var(--sidebar-width)",
          flexShrink: 0,
        }}
      >
        TOP TECH TOOLS
      </Link>

      {/* Nav tabs — hidden on mobile */}
      <Suspense>
        <div className="hide-mobile" style={{ display: "flex" }}>
          <NavTabs />
        </div>
      </Suspense>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search — hidden on mobile (toolbar has it) */}
      <div
        className="hide-mobile"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "6px 12px",
          width: "220px",
          cursor: "text",
        }}
      >
        <Search size={13} color="var(--text-secondary)" />
        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          Search tools…
        </span>
      </div>

      {/* Bell — hidden on mobile */}
      <Bell size={16} color="var(--text-secondary)" className="hide-mobile" style={{ cursor: "pointer" }} />

      {/* CTA */}
      <Link
        href="/submit"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 14px",
          background: "var(--accent)",
          color: "white",
          borderRadius: "7px",
          fontSize: "13px",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        <span className="hide-mobile">Submit a Tool</span>
        <ArrowUpRight size={13} />
      </Link>
    </header>
  );
}
