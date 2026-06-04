import Link from "next/link";
import { Star, Copy, ChevronLeft, ChevronRight, Flame, Clock, TrendingUp } from "lucide-react";
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

// Brand-colored provenance for each discovery source, so it's obvious at a glance
// where a tool was reported from. `mark` is a tiny monogram (GitHub uses its icon).
const SOURCE_META: Record<
  string,
  { label: string; color: string; mark: React.ReactNode }
> = {
  github: { label: "GitHub", color: "#8b949e", mark: "GH" },
  hackernews: { label: "Hacker News", color: "#ff6600", mark: "Y" },
  producthunt: { label: "Product Hunt", color: "#da552f", mark: "P" },
  reddit: { label: "Reddit", color: "#ff4500", mark: "r/" },
  curated: { label: "Surging", color: "var(--accent)", mark: <Flame size={10} /> },
};

const SOURCE_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SOURCE_META).map(([k, v]) => [k, v.label.toUpperCase()])
);

// Compact chip: brand-colored square monogram + source name. Makes provenance
// (GitHub / Hacker News / Product Hunt / Reddit) unmistakable.
function SourceBadge({ source }: { source: string }) {
  const meta = SOURCE_META[source] ?? { label: source, color: "var(--text-secondary)", mark: "•" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: meta.color,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "15px",
          height: "15px",
          borderRadius: "4px",
          background: `${meta.color}22`,
          border: `1px solid ${meta.color}55`,
          fontSize: "8px",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {meta.mark}
      </span>
      {meta.label}
    </span>
  );
}

function isNew(firstSeenAt: string) {
  return Date.now() - new Date(firstSeenAt).getTime() < 30 * 86400000;
}

type TrendingTool = Awaited<ReturnType<typeof getTools>>["items"][number];

function heatStyle(tool: TrendingTool) {
  const score = tool.trendingScore;
  if (score >= 75) {
    return {
      label: "Peak heat",
      color: "#fb7185",
      border: "rgba(251,113,133,0.44)",
      bg: "linear-gradient(135deg, rgba(251,113,133,0.13), rgba(245,158,11,0.06) 42%, var(--surface) 78%)",
      glow: "0 0 0 1px rgba(251,113,133,0.08), 0 14px 34px rgba(251,113,133,0.08)",
    };
  }
  if (score >= 45) {
    return {
      label: "Hot",
      color: "#f59e0b",
      border: "rgba(245,158,11,0.36)",
      bg: "linear-gradient(135deg, rgba(245,158,11,0.10), rgba(79,131,255,0.04) 48%, var(--surface) 82%)",
      glow: "0 0 0 1px rgba(245,158,11,0.06)",
    };
  }
  if (score >= 25) {
    return {
      label: "Rising",
      color: "#22c55e",
      border: "rgba(34,197,94,0.28)",
      bg: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(79,131,255,0.04) 48%, var(--surface) 82%)",
      glow: "none",
    };
  }
  return {
    label: "Steady",
    color: "var(--accent)",
    border: "var(--border)",
    bg: "var(--surface)",
    glow: "none",
  };
}

function tint(color: string, alpha: string) {
  if (color.startsWith("var(")) return "rgba(79,131,255,0.12)";
  return `${color}${alpha}`;
}

function signalLabel(tool: TrendingTool) {
  if (tool.starGrowthPct7d != null && tool.starGrowthPct7d >= 15) {
    return `+${Math.round(tool.starGrowthPct7d)}% stars/wk`;
  }
  if (tool.socialScore != null && tool.socialScore >= 55) {
    return `${Math.round(tool.socialScore)} social heat`;
  }
  if (isNew(tool.firstSeenAt)) return "New arrival";
  return null;
}

// Heat metric shown top-right of each card: repos show GitHub stars; products
// (no repo) show their normalized cross-source social heat instead.
function HeatMetric({ tool }: { tool: TrendingTool }) {
  const heat = heatStyle(tool);
  if (tool.kind === "product" || tool.stars === 0) {
    return (
      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: heat.color, fontWeight: 650 }}>
        <Flame size={11} fill="currentColor" />
        {Math.round(tool.socialScore ?? 0)}
      </span>
    );
  }
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: heat.color, fontWeight: 650 }}>
      <Star size={11} fill="currentColor" />
      {formatStars(tool.stars)}
    </span>
  );
}

function UpdatedStamp({ iso }: { iso: string | null }) {
  if (!iso) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "11px",
        fontWeight: 650,
        color: "#d7dcff",
        background: "rgba(215,220,255,0.08)",
        border: "1px solid rgba(215,220,255,0.13)",
        borderRadius: "5px",
        padding: "3px 7px",
        whiteSpace: "nowrap",
      }}
    >
      <Clock size={11} />
      Updated {timeAgo(iso)}
    </span>
  );
}

function SignalChip({ tool }: { tool: TrendingTool }) {
  const label = signalLabel(tool);
  if (!label) return null;
  const heat = heatStyle(tool);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: heat.color,
        background: tint(heat.color, "1f"),
        border: `1px solid ${tint(heat.color, "42")}`,
        borderRadius: "5px",
        padding: "2px 6px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <TrendingUp size={10} />
      {label}
    </span>
  );
}

export default async function HomePage() {
  const { items: tools } = await getTools({ sort: "trending", limit: 24, trendingOnly: true });

  if (tools.length === 0) {
    return (
      <div style={{ padding: "64px 32px", maxWidth: "560px" }}>
        <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "8px" }}>
          Curated Pulse
        </div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "12px" }}>
          Nothing trending yet
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
          The discovery crawl (GitHub rising · Hacker News · Product Hunt · Reddit) hasn&apos;t
          surfaced any fresh tools yet. It runs daily — check back soon, or browse the full
          ecosystem under <Link href="/explore" style={{ color: "var(--accent)" }}>Explore</Link>.
        </p>
      </div>
    );
  }

  const hero = tools[0];
  const featured = tools.slice(1, 3);
  const grid = tools.slice(3);
  const heroHeat = hero ? heatStyle(hero) : null;

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
                background: heroHeat?.bg ?? "var(--surface)",
                border: `1px solid ${heroHeat?.border ?? "var(--border)"}`,
                borderRadius: "12px",
                overflow: "hidden",
                height: "360px",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxShadow: heroHeat?.glow ?? "none",
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
{hero.kind === "product"
  ? `# ${hero.name}
  ${hero.description}

  ▲ trending on ${SOURCE_LABEL[hero.source] ?? hero.source}
  🔥 ${Math.round(hero.socialScore ?? 0)} heat`
  : `$ ${hero.brewName ?? hero.name} --help
  Fast, reliable tool for developers

  USAGE: ${hero.name} [OPTIONS] [ARGS]

  ★ ${formatStars(hero.stars)} stars on GitHub`}
                </pre>
              </div>

              {/* Info strip */}
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  {isNew(hero.firstSeenAt) && <span style={tagStyle("#22c55e")}>NEW</span>}
                  <SourceBadge source={hero.source} />
                  <SignalChip tool={hero} />
                  {hero.categories[0] && (
                    <span style={tagStyle("var(--text-secondary)")}>{hero.categories[0].label.toUpperCase()}</span>
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
          {featured.map((tool) => (
            <Link key={tool.id} href={`/tool/${tool.slug}`} style={{ display: "block", flex: 1 }}>
              <div
                style={{
                  background: heatStyle(tool).bg,
                  border: `1px solid ${heatStyle(tool).border}`,
                  borderRadius: "12px",
                  padding: "16px",
                  height: "100%",
                  transition: "border-color 0.15s",
                  boxShadow: heatStyle(tool).glow,
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
                  <HeatMetric tool={tool} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <SourceBadge source={tool.source} />
                  <SignalChip tool={tool} />
                  {isNew(tool.firstSeenAt) && (
                    <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", color: "#22c55e", textTransform: "uppercase" }}>
                      Just landed
                    </span>
                  )}
                </div>
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
                  background: heatStyle(tool).bg,
                  border: `1px solid ${heatStyle(tool).border}`,
                  borderRadius: "10px",
                  padding: "14px 16px",
                  transition: "border-color 0.15s",
                  boxShadow: heatStyle(tool).glow,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{tool.name}</span>
                  <HeatMetric tool={tool} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px", minHeight: "20px", flexWrap: "wrap" }}>
                  <SourceBadge source={tool.source} />
                  <SignalChip tool={tool} />
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
                  <UpdatedStamp iso={tool.dataFetchedAt ?? tool.updatedAt} />
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
