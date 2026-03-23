"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { Menu, Search } from "lucide-react";
import type { ViewMode } from "@/lib/types";

const VIEWS: { value: ViewMode; label: string }[] = [
  { value: "list", label: "List" },
  { value: "table", label: "Table" },
  { value: "cards", label: "Cards" },
];

type ToolbarProps = {
  active: ViewMode;
  total: number;
};

export function Toolbar({ active, total }: ToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

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

  const setView = (view: ViewMode) => {
    update({ view: view === "cards" ? "" : view });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 16px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}
    >
      {/* Hamburger (decorative for now) */}
      <button
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "34px",
          height: "34px",
          borderRadius: "7px",
          border: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text-secondary)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Menu size={15} />
      </button>

      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: inputRef.current?.value ?? "" });
        }}
        style={{ flex: 1 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            ref={inputRef}
            defaultValue={searchParams.get("q") ?? ""}
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

      {/* View toggle */}
      <div
        style={{
          display: "flex",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {VIEWS.map(({ value, label }, i) => (
          <button
            key={value}
            onClick={() => setView(value)}
            style={{
              padding: "6px 14px",
              fontSize: "13px",
              fontWeight: active === value ? 600 : 400,
              background: active === value ? "var(--text-primary)" : "transparent",
              color: active === value ? "var(--bg)" : "var(--text-secondary)",
              border: "none",
              borderLeft: i > 0 ? "1px solid var(--border)" : "none",
              cursor: "pointer",
              transition: "all 0.12s",
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Count */}
      <span
        style={{
          fontSize: "13px",
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {total} of {total}
      </span>
    </div>
  );
}
