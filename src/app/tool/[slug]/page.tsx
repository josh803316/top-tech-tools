import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolBySlug, getTools } from "@/lib/queries/tools";
import { Star, GitFork, AlertCircle, ExternalLink, Package, Copy, ArrowRight } from "lucide-react";

export const revalidate = 3600;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function timeAgo(iso: string | null): string {
  if (!iso) return "unknown";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  // Fetch related tools from same category
  const primaryCategory = tool.categories[0];
  const relatedData = primaryCategory
    ? await getTools({ category: primaryCategory.slug, sort: "stars", limit: 6 })
    : { items: [] };
  const related = relatedData.items.filter((t) => t.slug !== tool.slug).slice(0, 4);

  return (
    <div style={{ padding: "32px 32px 80px" }}>
      {/* Back */}
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "12px",
          color: "var(--text-secondary)",
          marginBottom: "28px",
          transition: "color 0.15s",
        }}
      >
        ← Back to leaderboard
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "28px" }}>
        {/* Main column */}
        <div>
          {/* Version + stars row */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            {tool.currentVersion && (
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--accent)",
                  border: "1px solid rgba(79,131,255,0.4)",
                  borderRadius: "5px",
                  padding: "3px 8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Version {tool.currentVersion}
              </span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--accent)", fontSize: "13px", fontWeight: 500 }}>
              <Star size={13} fill="currentColor" />
              {formatNumber(tool.stars)}
            </div>
          </div>

          {/* Tool name */}
          <h1
            style={{
              fontSize: "52px",
              fontWeight: 800,
              letterSpacing: "-0.05em",
              color: "var(--text-primary)",
              lineHeight: 1,
              marginBottom: "16px",
            }}
          >
            {tool.name}
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: "16px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: "600px",
              marginBottom: "28px",
            }}
          >
            {tool.description}
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "36px" }}>
            {tool.githubUrl && (
              <a
                href={tool.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 22px",
                  background: "var(--text-primary)",
                  color: "var(--bg)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={14} />
                GitHub Repository
              </a>
            )}
            {tool.brewUrl && (
              <a
                href={tool.brewUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "11px 22px",
                  background: "var(--surface-2)",
                  color: "var(--text-primary)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  border: "1px solid var(--border)",
                }}
              >
                <Package size={14} />
                Homebrew
              </a>
            )}
          </div>

          {/* Installation section */}
          <div style={{ marginBottom: "36px" }}>
            <h2 style={sectionHeading}>Installation</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {tool.brewName && (
                <InstallCard title="Homebrew" command={`brew install ${tool.brewName}`} />
              )}
              {tool.githubUrl && (
                <InstallCard
                  title="From Source"
                  command={`git clone ${tool.githubUrl}`}
                />
              )}
            </div>
          </div>

          {/* Topics */}
          {tool.githubTopics.length > 0 && (
            <div>
              <h2 style={sectionHeading}>Topics</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {tool.githubTopics.map((t) => (
                  <span
                    key={t}
                    style={{
                      padding: "4px 10px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Quick Install */}
          {tool.brewName && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  marginBottom: "12px",
                }}
              >
                Quick Install
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid var(--border)",
                  borderRadius: "7px",
                  padding: "10px 12px",
                  marginBottom: "12px",
                  gap: "8px",
                }}
              >
                <code style={{ fontSize: "12px", color: "var(--text-primary)", fontFamily: "monospace" }}>
                  brew install {tool.brewName}
                </code>
                <Copy size={12} color="var(--text-secondary)" style={{ cursor: "pointer", flexShrink: 0 }} />
              </div>
            </div>
          )}

          {/* Vital Statistics */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-secondary)",
                marginBottom: "14px",
              }}
            >
              Vital Statistics
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <StatRow label="Stars" value={formatNumber(tool.stars)} />
              <StatRow label="Forks" value={formatNumber(tool.forks)} />
              {tool.openIssues > 0 && <StatRow label="Open Issues" value={formatNumber(tool.openIssues)} />}
              {tool.installsLast30d > 0 && (
                <StatRow label="Installs / 30d" value={formatNumber(tool.installsLast30d)} />
              )}
              {tool.lastPushedAt && (
                <StatRow label="Last Commit" value={timeAgo(tool.lastPushedAt)} />
              )}
              {tool.categories.map((c) => (
                <StatRow key={c.slug} label="Category" value={c.label} />
              ))}
            </div>
          </div>

          {/* Related Tools */}
          {related.length > 0 && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                  marginBottom: "12px",
                }}
              >
                Related Tools
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {related.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tool/${t.slug}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 0",
                      borderBottom: "1px solid var(--border)",
                      gap: "8px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "2px" }}>
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {t.description}
                      </div>
                    </div>
                    <ArrowRight size={13} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

function InstallCard({ title, command }: { title: string; command: string }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>
        {title}
      </div>
      <code
        style={{
          display: "block",
          fontSize: "12px",
          fontFamily: "monospace",
          color: "var(--accent)",
          background: "rgba(0,0,0,0.3)",
          padding: "8px 10px",
          borderRadius: "6px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {command}
      </code>
    </div>
  );
}

const sectionHeading: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "14px",
  letterSpacing: "-0.01em",
};
