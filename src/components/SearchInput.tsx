"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from URL
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateQ = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      params.delete("cursor");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => updateQ(v), 300);
  };

  const handleClear = () => {
    setValue("");
    updateQ("");
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "480px",
      }}
    >
      <Search
        size={16}
        style={{
          position: "absolute",
          left: "12px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text-secondary)",
          pointerEvents: "none",
        }}
      />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="Search tools..."
        style={{
          width: "100%",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "9px 36px",
          color: "var(--text-primary)",
          fontSize: "14px",
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => ((e.target as HTMLElement).style.borderColor = "var(--accent)")}
        onBlur={(e) => ((e.target as HTMLElement).style.borderColor = "var(--border)")}
      />
      {value && (
        <button
          onClick={handleClear}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
