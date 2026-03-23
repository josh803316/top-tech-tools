"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { List, Table2, LayoutGrid } from "lucide-react";

export type ViewMode = "table" | "list" | "cards";

const VIEWS: { value: ViewMode; Icon: React.ElementType; label: string }[] = [
  { value: "table", Icon: Table2, label: "Table" },
  { value: "list", Icon: List, label: "List" },
  { value: "cards", Icon: LayoutGrid, label: "Cards" },
];

export function ViewToggle({ active }: { active: ViewMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setView = useCallback(
    (view: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (view === "table") params.delete("view");
      else params.set("view", view);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "7px",
        padding: "3px",
      }}
    >
      {VIEWS.map(({ value, Icon, label }) => (
        <button
          key={value}
          onClick={() => setView(value)}
          title={label}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "24px",
            borderRadius: "5px",
            border: "none",
            background: active === value ? "var(--accent-dim)" : "transparent",
            color: active === value ? "var(--accent)" : "var(--text-muted)",
            cursor: "pointer",
            transition: "all 0.12s",
          }}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}
