import { NextRequest, NextResponse } from "next/server";
import { getTools } from "@/lib/queries/tools";
import type { Tool } from "@/lib/types";

export const runtime = "nodejs";

// Public, key-less trending feed purpose-built for programmatic consumers
// (curl/httpie/wget, cortanha's weekly evaluator). Single flat response — no
// cursor to walk — capped at MAX. Serves the raw `description`; any relevance
// scoring / summarization happens downstream, not here, so this stays free.
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 100;

type TrendingItem = {
  name: string;
  slug: string;
  description: string;
  url: string | null;
  websiteUrl: string | null;
  source: Tool["source"];
  kind: Tool["kind"];
  stars: number;
  starGrowthPct7d: number | null;
  trendingScore: number;
  socialScore: number | null;
  ageDays: number | null;
  firstSeenAt: string;
  categories: string[];
  signal: string;
};

function ageDays(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return ms > 0 ? Math.floor(ms / 86_400_000) : null;
}

function formatStars(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// Deterministic, human-readable one-liner assembled from existing numbers —
// a quick ranking hint for consumers. Not an LLM summary.
function buildSignal(t: Tool, age: number | null): string {
  const parts: string[] = [];
  if (t.stars > 0) parts.push(`${formatStars(t.stars)}★`);
  if (t.starGrowthPct7d != null && t.starGrowthPct7d > 0) {
    parts.push(`+${Math.round(t.starGrowthPct7d)}%/wk`);
  }
  if (age != null) parts.push(`${age}d old`);
  parts.push(`via ${t.source}`);
  return parts.join(" · ");
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const raw = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(raw)
    ? Math.min(Math.max(raw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  try {
    const { items } = await getTools({
      sort: "trending",
      trendingOnly: true,
      limit,
    });

    const tools: TrendingItem[] = items.map((t) => {
      const age = ageDays(t.githubCreatedAt ?? t.firstSeenAt);
      return {
        name: t.name,
        slug: t.slug,
        description: t.description,
        url: t.githubUrl ?? t.websiteUrl ?? null,
        websiteUrl: t.websiteUrl,
        source: t.source,
        kind: t.kind,
        stars: t.stars,
        starGrowthPct7d: t.starGrowthPct7d,
        trendingScore: t.trendingScore,
        socialScore: t.socialScore,
        ageDays: age,
        firstSeenAt: t.firstSeenAt,
        categories: t.categories.map((c) => c.slug),
        signal: buildSignal(t, age),
      };
    });

    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        count: tools.length,
        limit,
        items: tools,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300",
        },
      }
    );
  } catch (err) {
    console.error("[/api/trending]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
