import Link from "next/link";
import { Star, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { getTools } from "@/lib/queries/tools";

export const revalidate = 3600;

function formatStars(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function timeAgo(iso: string | null) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function TrendingPage() {
  const { items: tools } = await getTools({ sort: "trending", limit: 24 });
  const hero = tools[0];
  const featured = tools.slice(1, 3);
  const grid = tools.slice(3);

  return (
    <div style={{ padding: "32px 32px 64px" }}>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--accent)",
              marginBottom: "8px",
            }}
          >
            Curated Pulse
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
            Trending This Week
          </h1>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[ChevronLeft, ChevronRight].map((Icon, i) => (
            <button
              key={i}
              style={{
                width: "32px",
                height: "32px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-secondary)",
              }}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Hero section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", marginBottom: "40px" }}>
        {/* Hero card */}
        {hero && (
          <Link href={`/tool/${hero.slug}`} style={{ display: "block" }}>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                overflow: "hidden",
                height: "360px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
              className="card-hover"
            >
              {/* Terminal preview area */}
              <div
                style={{
                  flex: 1,
                  background: "#0a0b0f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "rgba(79,131,255,0.5)",
                  overflow: "hidden",
                  position: "relative",
                  padding: "20px",
                }}
              >
                <pre
                  style={{
                    color: "rgba(79,131,255,0.6)",
                    fontSize: "11px",
                    lineHeight: 1.6,
                    userSelect: "none",
                  }}
                >
{`$ ${hero.brewName ?? hero.name} --help
  Fast, reliable tool for developers

  USAGE: ${hero.name} [OPTIONS] [ARGS]

  ★ ${formatStars(hero.stars)} stars on GitHub`}
                </pre>
              </div>

              {/* Info strip */}
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                  <span style={tagStyle("#22c55e")}>NEW</span>
                  {hero.categories[0] && (
                    <span style={tagStyle("var(--accent)")}>{hero.categories[0].label.toUpperCase()}</span>
                  )}
                </div>
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}
                >
                  {hero.name}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: 1.4, marginBottom: "12px" }}>
                  {hero.description}
                </p>
                {hero.brewName && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(79,131,255,0.08)",
                      border: "1px solid rgba(79,131,255,0.2)",
                      borderRadius: "6px",
                      padding: "8px 12px",
                    }}
                  >
                    <code style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "monospace" }}>
                      brew install {hero.brewName}
                    </code>
                    <Copy size={12} color="var(--text-secondary)" />
                  </div>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* Right featured cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {featured.map((tool, i) => (
            <Link key={tool.id} href={`/tool/${tool.slug}`} style={{ display: "block", flex: 1 }}>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  padding: "16px",
                  height: "100%",
                  transition: "border-color 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      background: "var(--bg)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    {tool.categories[0]?.iconName === "Terminal" ? "⌘" : "◈"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--accent)", fontSize: "12px" }}>
                    <Star size={11} fill="currentColor" />
                    {formatStars(tool.stars)}
                  </div>
                </div>
                {i === 1 && (
                  <div
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      color: "var(--accent)",
                      textTransform: "uppercase",
                      marginBottom: "6px",
                    }}
                  >
                    Top Contributor Choice
                  </div>
                )}
                <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                  {tool.name}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                  {tool.description.slice(0, 80)}{tool.description.length > 80 ? "…" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Browse section */}
      <div>
        {/* Sort tabs + filter row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "4px" }}>
            {["Latest", "Top Ranked", "Most Starred"].map((label, i) => (
              <button
                key={label}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  border: "1px solid var(--border)",
                  background: i === 0 ? "var(--surface-2)" : "transparent",
                  color: i === 0 ? "var(--text-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: i === 0 ? 500 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "auto" }}>
            Displaying {tools.length} tools
          </span>
        </div>

        {/* Tool grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "12px",
          }}
        >
          {grid.map((tool) => (
            <Link key={tool.id} href={`/tool/${tool.slug}`} style={{ display: "block" }}>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  transition: "border-color 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{tool.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--accent)" }}>
                    <Star size={11} fill="currentColor" />
                    {formatStars(tool.stars)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.4,
                    marginBottom: "10px",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {tool.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {tool.categories.slice(0, 2).map((c) => (
                      <span
                        key={c.slug}
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          letterSpacing: "0.06em",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "var(--surface-2)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {c.label.toUpperCase()}
                      </span>
                    ))}
                  </div>
                  {tool.updatedAt && (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Updated {timeAgo(tool.updatedAt)}
                    </span>
                  )}
                </div>
                {tool.brewName && (
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "6px 10px",
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "5px",
                      fontSize: "11px",
                      fontFamily: "monospace",
                      color: "var(--text-secondary)",
                    }}
                  >
                    brew install {tool.brewName}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function tagStyle(color: string): React.CSSProperties {
  return {
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    padding: "2px 7px",
    borderRadius: "4px",
    background: `${color}22`,
    color: color,
    border: `1px solid ${color}44`,
  };
}
