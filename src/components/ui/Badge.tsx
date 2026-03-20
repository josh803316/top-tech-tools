"use client";

import { clsx } from "clsx";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "featured" | "category";
  className?: string;
  style?: React.CSSProperties;
};

const BG: Record<string, string> = {
  default: "rgba(255,255,255,0.08)",
  featured: "rgba(245,158,11,0.2)",
  category: "rgba(99,102,241,0.15)",
};

export function Badge({ children, variant = "default", className, style }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        variant === "featured" && "text-amber-400",
        variant === "category" && "text-[var(--accent)]",
        variant === "default" && "text-[var(--text-secondary)]",
        className
      )}
      style={{ backgroundColor: BG[variant], ...style }}
    >
      {children}
    </span>
  );
}
