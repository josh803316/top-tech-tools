import Link from "next/link";
import { getTopToolsByCategory, getAllCategories } from "@/lib/queries/tools";
import {
  Search, FolderOpen, GitBranch, Terminal, FileText,
  Cpu, Wifi, Zap, Box,
} from "lucide-react";
import type { Category } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = {
  Search, FolderOpen, GitBranch, Terminal, FileText, Cpu, Wifi, Zap, Box,
};

export const revalidate = 3600;

export default async function CollectionsPage() {
  const [categories, leaderboard] = await Promise.all([
    getAllCategories(),
    getTopToolsByCategory(1),
  ]);

  const toolCountMap = new Map(leaderboard.map(({ category, tools }) => [category.slug, tools.length]));

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      {/* Header */}
      <div style={{ marginBottom: "36px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--accent)",
            marginBottom: "10px",
          }}
        >
          Archive Explorer
        </div>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
            marginBottom: "10px",
          }}
        >
          Collections
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "540px", lineHeight: 1.5 }}>
          Curated ecosystems of specialized tools. Machined for performance, indexed for the elite workflow.
        </p>
      </div>

      {/* Collections grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "14px",
        }}
      >
        {/* Hero collection — first category full width */}
        {categories[0] && <HeroCard category={categories[0]} />}

        {/* Rest */}
        {categories.slice(1).map((cat, i) => (
          <CollectionCard key={cat.slug} category={cat} featured={i === 0} />
        ))}
      </div>
    </div>
  );
}

function HeroCard({ category }: { category: Category }) {
  const Icon = ICONS[category.iconName] ?? Terminal;
  return (
    <Link
      href={`/?category=${category.slug}`}
      style={{
        gridColumn: "span 2",
        display: "block",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "40px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          minHeight: "200px",
          position: "relative",
          overflow: "hidden",
          transition: "border-color 0.15s",
        }}
      >
        {/* Background icon */}
        <div
          style={{
            position: "absolute",
            right: "40px",
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.06,
          }}
        >
          <Icon size={120} color="white" />
        </div>

        <div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--accent)",
              background: "var(--accent-dim)",
              padding: "3px 8px",
              borderRadius: "4px",
              display: "inline-block",
              marginBottom: "12px",
            }}
          >
            Stable
          </span>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            {category.label}
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Essential tools in the {category.label.toLowerCase()} category
          </p>
        </div>
      </div>
    </Link>
  );
}

function CollectionCard({ category, featured }: { category: Category; featured?: boolean }) {
  const Icon = ICONS[category.iconName] ?? Terminal;
  return (
    <Link href={`/?category=${category.slug}`} style={{ display: "block" }}>
      <div
        style={{
          background: "var(--surface)",
          border: featured ? "1px dashed rgba(79,131,255,0.5)" : "1px solid var(--border)",
          borderRadius: "12px",
          padding: "20px",
          minHeight: "160px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
        className={featured ? undefined : "collection-hover"}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: featured ? "var(--accent-dim)" : "var(--bg)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={16} color={featured ? "var(--accent)" : "var(--text-secondary)"} />
          </div>
        </div>

        <div>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
              marginBottom: "6px",
            }}
          >
            {category.label}
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            Top-ranked {category.label.toLowerCase()} tools and utilities
          </p>
        </div>
      </div>
    </Link>
  );
}
