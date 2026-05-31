import { db } from "@/lib/db";
import { tools, categories, toolCategories } from "@/lib/db/schema";
import { CURATED_TOOLS, CURATED_CATEGORIES } from "@/lib/seed/curated-tools";
import { fetchGitHubRepo, computeTrendingScore } from "./github";
import { fetchBrewFormula, getBrewInstalls30d } from "./brew";
import {
  discoverNewTools,
  githubCandidatesFromUrls,
  inferCategories,
  type DiscoveredTool,
} from "./discover";
import { fetchTrendingProductHunt } from "./producthunt";
import { discoverFromHackerNews } from "./hackernews";
import { snapshotMetrics, computeStarGrowthPct7d } from "./history";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Build a map of `owner/repo` (lowercased) → Product Hunt rank, so a tool that
 * is trending on PH gets a consensus bonus in its trending score. Empty when no
 * PRODUCT_HUNT_TOKEN is configured (fetcher returns [] gracefully).
 */
async function buildPhRankMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const products = await fetchTrendingProductHunt({ first: 50 });
  for (const p of products) {
    if (!p.githubUrl) continue;
    const m = p.githubUrl.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
    if (m) map.set(`${m[1]}/${m[2].replace(/\.git$/, "")}`.toLowerCase(), p.rank);
  }
  return map;
}

export async function syncAllTools(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];

  await upsertCategories();

  const [brewInstalls, phRankMap] = await Promise.all([
    getBrewInstalls30d(),
    buildPhRankMap().catch((e) => {
      errors.push(`[producthunt] ${e instanceof Error ? e.message : String(e)}`);
      return new Map<string, number>();
    }),
  ]);

  let synced = 0;
  for (const tool of CURATED_TOOLS) {
    try {
      await syncTool(tool, brewInstalls, phRankMap);
      synced++;
    } catch (err) {
      errors.push(`${tool.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
    // Stagger to avoid GitHub rate limit bursts
    await new Promise((r) => setTimeout(r, 150));
  }

  // Slugs we already track (curated + everything in the DB) — both discovery
  // paths below dedupe against this so nothing is inserted twice.
  const knownSlugs = new Set(CURATED_TOOLS.map((t) => t.slug));
  try {
    const existingInDb = await db.query.tools.findMany({ columns: { slug: true } });
    for (const row of existingInDb) knownSlugs.add(row.slug);
  } catch (err) {
    errors.push(`[discovery-prep] ${err instanceof Error ? err.message : String(err)}`);
  }

  // 1) Auto-discover from GitHub topic search (existing path)
  try {
    const discovered = await discoverNewTools(knownSlugs);
    for (const tool of discovered) {
      try {
        await syncDiscoveredTool(tool, brewInstalls, phRankMap);
        knownSlugs.add(tool.slug);
        synced++;
      } catch (err) {
        errors.push(`[discovered] ${tool.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  } catch (err) {
    errors.push(`[discovery] ${err instanceof Error ? err.message : String(err)}`);
  }

  // 2) Web-grounded discovery from Hacker News — surfaces virally-trending tools
  //    BEFORE they fit the GitHub-topic taxonomy (the gap that missed terax-ai).
  try {
    const hn = await discoverFromHackerNews({ minPoints: 100 });
    const ghUrls = hn.map((c) => c.githubUrl).filter((u): u is string => u !== null);
    const candidates = githubCandidatesFromUrls(ghUrls);
    for (const { owner, repo } of candidates) {
      const slug = toSlug(repo);
      if (knownSlugs.has(slug)) continue;
      knownSlugs.add(slug);
      try {
        const gh = await fetchGitHubRepo(owner, repo);
        if (!gh) continue;
        const topicCats = inferCategories(gh.topics);
        const dt: DiscoveredTool = {
          slug,
          name: repo,
          description: gh.description,
          githubOwner: owner,
          githubRepo: repo,
          stars: gh.stargazers_count,
          pushedAt: gh.pushed_at,
          topics: gh.topics,
          categories: topicCats.length ? topicCats : ["productivity"],
        };
        await syncDiscoveredTool(dt, brewInstalls, phRankMap);
        synced++;
      } catch (err) {
        errors.push(`[hn] ${owner}/${repo}: ${err instanceof Error ? err.message : String(err)}`);
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  } catch (err) {
    errors.push(`[hn-discovery] ${err instanceof Error ? err.message : String(err)}`);
  }

  return { synced, errors };
}

async function upsertCategories() {
  for (const cat of CURATED_CATEGORIES) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, cat.slug),
    });
    if (existing) {
      // Update label/icon/sortOrder in case they changed
      await db.update(categories).set({ label: cat.label, iconName: cat.iconName, sortOrder: cat.sortOrder }).where(eq(categories.slug, cat.slug));
    } else {
      await db.insert(categories).values({ id: randomUUID(), ...cat });
    }
  }
}

async function syncTool(
  tool: (typeof CURATED_TOOLS)[number],
  brewInstalls: Map<string, number>,
  phRankMap: Map<string, number>
) {
  const hasGitHub = !!tool.githubOwner && !!tool.githubRepo;

  const [githubData, brewData] = await Promise.all([
    hasGitHub
      ? fetchGitHubRepo(tool.githubOwner!, tool.githubRepo!)
      : Promise.resolve(null),
    tool.brewName ? fetchBrewFormula(tool.brewName) : Promise.resolve(null),
  ]);

  const stars = githubData?.stargazers_count ?? 0;
  const forks = githubData?.forks_count ?? 0;
  const pushedAt = githubData?.pushed_at ?? null;
  const installsLast30d = tool.brewName ? (brewInstalls.get(tool.brewName) ?? 0) : 0;
  const githubUrl = githubData?.html_url
    ?? (hasGitHub ? `https://github.com/${tool.githubOwner}/${tool.githubRepo}` : null);
  const phRank = hasGitHub
    ? (phRankMap.get(`${tool.githubOwner}/${tool.githubRepo}`.toLowerCase()) ?? null)
    : null;

  const existing = await db.query.tools.findFirst({ where: eq(tools.slug, tool.slug) });
  const toolId = existing?.id ?? randomUUID();

  // Star-growth velocity from prior snapshots (null for brand-new tools).
  const starGrowthPct7d = existing ? await computeStarGrowthPct7d(toolId, stars) : null;
  const trendingScore = computeTrendingScore({ stars, pushedAt, starGrowthPct7d, phRank });

  const toolData = {
    slug: tool.slug,
    name: tool.name,
    description: githubData?.description || tool.description,
    githubOwner: tool.githubOwner ?? null,
    githubRepo: tool.githubRepo ?? null,
    githubUrl,
    websiteUrl: tool.websiteUrl ?? githubUrl ?? null,
    stars,
    forks,
    openIssues: githubData?.open_issues_count ?? 0,
    githubTopics: githubData?.topics ?? [],
    lastPushedAt: pushedAt ? new Date(pushedAt) : null,
    brewName: tool.brewName ?? null,
    brewUrl: tool.brewName ? `https://formulae.brew.sh/formula/${tool.brewName}` : null,
    installsLast30d,
    currentVersion: brewData?.versions?.stable ?? null,
    featured: tool.featured ?? false,
    trendingScore,
    starGrowthPct7d,
    updatedAt: new Date(),
    dataFetchedAt: new Date(),
  };

  if (existing) {
    await db.update(tools).set(toolData).where(eq(tools.slug, tool.slug));
  } else {
    await db.insert(tools).values({ id: toolId, ...toolData });
  }

  // Record the point-in-time snapshot for future growth computation.
  await snapshotMetrics(toolId, { stars, forks, installsLast30d });

  // Sync category associations
  const catRecords = await db.query.categories.findMany();
  const catMap = new Map(catRecords.map((c) => [c.slug, c.id]));

  await db.delete(toolCategories).where(eq(toolCategories.toolId, toolId));
  for (const catSlug of tool.categories) {
    const catId = catMap.get(catSlug);
    if (catId) {
      await db.insert(toolCategories).values({ toolId, categoryId: catId });
    }
  }
}

async function syncDiscoveredTool(
  tool: DiscoveredTool,
  brewInstalls: Map<string, number>,
  phRankMap: Map<string, number>
) {
  const githubData = await fetchGitHubRepo(tool.githubOwner, tool.githubRepo);

  const stars = githubData?.stargazers_count ?? tool.stars;
  const forks = githubData?.forks_count ?? 0;
  const pushedAt = githubData?.pushed_at ?? tool.pushedAt;
  const githubUrl = `https://github.com/${tool.githubOwner}/${tool.githubRepo}`;
  const phRank = phRankMap.get(`${tool.githubOwner}/${tool.githubRepo}`.toLowerCase()) ?? null;

  const existing = await db.query.tools.findFirst({ where: eq(tools.slug, tool.slug) });
  const toolId = existing?.id ?? randomUUID();

  const starGrowthPct7d = existing ? await computeStarGrowthPct7d(toolId, stars) : null;
  const trendingScore = computeTrendingScore({ stars, pushedAt, starGrowthPct7d, phRank });

  const toolData = {
    slug: tool.slug,
    name: githubData ? tool.githubRepo : tool.name,
    description: githubData?.description || tool.description || "",
    githubOwner: tool.githubOwner,
    githubRepo: tool.githubRepo,
    githubUrl,
    websiteUrl: githubUrl,
    stars,
    forks,
    openIssues: githubData?.open_issues_count ?? 0,
    githubTopics: githubData?.topics ?? tool.topics,
    lastPushedAt: pushedAt ? new Date(pushedAt) : null,
    brewName: null,
    brewUrl: null,
    installsLast30d: 0,
    currentVersion: null,
    featured: false,
    trendingScore,
    starGrowthPct7d,
    updatedAt: new Date(),
    dataFetchedAt: new Date(),
  };

  if (existing) {
    // Only update metrics for discovered tools; don't overwrite curated metadata
    await db.update(tools).set({
      stars: toolData.stars,
      forks: toolData.forks,
      openIssues: toolData.openIssues,
      lastPushedAt: toolData.lastPushedAt,
      trendingScore: toolData.trendingScore,
      starGrowthPct7d: toolData.starGrowthPct7d,
      updatedAt: toolData.updatedAt,
      dataFetchedAt: toolData.dataFetchedAt,
    }).where(eq(tools.slug, tool.slug));
  } else {
    await db.insert(tools).values({ id: toolId, ...toolData });
  }

  // Record the point-in-time snapshot for future growth computation.
  await snapshotMetrics(toolId, { stars, forks, installsLast30d: toolData.installsLast30d });

  // Sync category associations
  const catRecords = await db.query.categories.findMany();
  const catMap = new Map(catRecords.map((c) => [c.slug, c.id]));

  await db.delete(toolCategories).where(eq(toolCategories.toolId, toolId));
  for (const catSlug of tool.categories) {
    const catId = catMap.get(catSlug);
    if (catId) {
      await db.insert(toolCategories).values({ toolId, categoryId: catId });
    }
  }
}

export { upsertCategories };
