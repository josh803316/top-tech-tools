import { db } from "@/lib/db";
import { tools, categories, toolCategories } from "@/lib/db/schema";
import { CURATED_TOOLS, CURATED_CATEGORIES } from "@/lib/seed/curated-tools";
import {
  fetchGitHubRepo,
  computeTrendingScore,
  computeTrendingEligible,
  phRankToSocialScore,
} from "./github";
import { fetchBrewFormula, getBrewInstalls30d } from "./brew";
import {
  discoverNewTools,
  discoverRisingRepos,
  inferCategories,
  type DiscoveredTool,
} from "./discover";
import { fetchTrendingProductHunt } from "./producthunt";
import { discoverFromHackerNews } from "./hackernews";
import { discoverFromReddit } from "./reddit";
import {
  hnPointsToSocialScore,
  type ProductHit,
  type SocialSource,
} from "./social";
import { snapshotMetrics, computeStarGrowthPct7d } from "./history";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// Product Hunt topics that mark a post as an actual developer/AI/design tool —
// everything else (Marketing, Sales, E-Commerce, generic SaaS) is dropped so the
// trending surface stays dev-focused, not a Product Hunt mirror.
const PH_DEV_TOPICS = new Set([
  "developer tools",
  "development",
  "design tools",
  "artificial intelligence",
  "open source",
  "github",
  "api",
  "apis",
  "sdk",
  "code editors",
  "no-code",
]);

function isDevProduct(topics: string[]): boolean {
  return topics.some((t) => PH_DEV_TOPICS.has(t.trim().toLowerCase()));
}

const SHOW_HN_RE = /^show\s*hn[:\-]/i;
function isShowHn(title: string): boolean {
  return SHOW_HN_RE.test(title);
}

// Turn "Show HN: Foo – a fast bar" into "Foo". HN front-page headlines (news,
// opinion) are NOT launches, so only Show HN posts become product entries.
function cleanShowHnName(title: string): string {
  let t = title.replace(SHOW_HN_RE, "").trim();
  const sep = t.search(/\s[–—-]\s/);
  if (sep > 0) t = t.slice(0, sep).trim();
  return t.slice(0, 60);
}

/** A normalized cross-source social signal for one repo. */
type RepoSignal = { score: number; source: SocialSource };

/**
 * Gather web-grounded signals from Product Hunt, Hacker News and Reddit in one
 * pass. Returns the best (max) social score per repo (`owner/repo` lowercased),
 * plus product launches that have no public repo so they can become product rows.
 */
async function gatherSocialSignals(): Promise<{
  repoSignals: Map<string, RepoSignal>;
  products: ProductHit[];
  errors: string[];
}> {
  const errors: string[] = [];
  const repoSignals = new Map<string, RepoSignal>();
  const products: ProductHit[] = [];

  const addRepo = (owner: string, repo: string, score: number, source: SocialSource) => {
    const key = `${owner}/${repo.replace(/\.git$/, "")}`.toLowerCase();
    const existing = repoSignals.get(key);
    if (!existing || score > existing.score) repoSignals.set(key, { score, source });
  };
  const ghParts = (url: string) => url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);

  // Product Hunt
  try {
    const ph = await fetchTrendingProductHunt({ first: 50 });
    for (const p of ph) {
      const score = phRankToSocialScore(p.rank);
      const m = p.githubUrl ? ghParts(p.githubUrl) : null;
      if (m) addRepo(m[1], m[2], score, "producthunt");
      else if (isDevProduct(p.topics))
        products.push({
          name: p.name,
          tagline: p.tagline,
          url: p.url,
          source: "producthunt",
          socialScore: score,
          topics: p.topics,
        });
    }
  } catch (e) {
    errors.push(`[producthunt] ${e instanceof Error ? e.message : String(e)}`);
  }

  // Hacker News
  try {
    const hn = await discoverFromHackerNews({ minPoints: 100 });
    for (const c of hn) {
      const score = hnPointsToSocialScore(c.points);
      const m = c.githubUrl ? ghParts(c.githubUrl) : null;
      if (m) addRepo(m[1], m[2], score, "hackernews");
      else if (c.url && isShowHn(c.title))
        products.push({
          name: cleanShowHnName(c.title),
          tagline: c.title,
          url: c.url,
          source: "hackernews",
          socialScore: score,
          topics: [],
        });
    }
  } catch (e) {
    errors.push(`[hackernews] ${e instanceof Error ? e.message : String(e)}`);
  }

  // Reddit
  try {
    const { repos, products: redditProducts } = await discoverFromReddit({ minUps: 200 });
    for (const r of repos) addRepo(r.owner, r.repo, r.socialScore, "reddit");
    products.push(...redditProducts);
  } catch (e) {
    errors.push(`[reddit] ${e instanceof Error ? e.message : String(e)}`);
  }

  return { repoSignals, products, errors };
}

export async function syncAllTools(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];

  await upsertCategories();

  const [brewInstalls, social] = await Promise.all([
    getBrewInstalls30d(),
    gatherSocialSignals(),
  ]);
  errors.push(...social.errors);
  const { repoSignals } = social;

  let synced = 0;
  const curatedSlugs = new Set(CURATED_TOOLS.map((t) => t.slug));
  const touched = new Set<string>(); // slugs synced this run (skip in refresh pass)
  for (const tool of CURATED_TOOLS) {
    try {
      await syncTool(tool, brewInstalls, repoSignals);
      synced++;
    } catch (err) {
      errors.push(`${tool.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
    touched.add(tool.slug);
    await new Promise((r) => setTimeout(r, 150));
  }

  // Slugs we already track (curated + everything in the DB) — discovery dedupes
  // against this so nothing is inserted twice.
  const knownSlugs = new Set(CURATED_TOOLS.map((t) => t.slug));
  try {
    const existingInDb = await db.query.tools.findMany({ columns: { slug: true } });
    for (const row of existingInDb) knownSlugs.add(row.slug);
  } catch (err) {
    errors.push(`[discovery-prep] ${err instanceof Error ? err.message : String(err)}`);
  }

  // 1) GitHub discovery: established topic crawl + RISING (young, lower-floor) crawl.
  try {
    // Sequential, rising first: the GitHub *search* API rate limit is tight
    // (~30/min), so give the newcomer crawl the fresh budget rather than racing
    // both crawls in parallel and starving it.
    const risingTools = await discoverRisingRepos(knownSlugs);
    const topicTools = await discoverNewTools(knownSlugs);
    const discovered = [...risingTools, ...topicTools];
    for (const tool of discovered) {
      if (knownSlugs.has(tool.slug)) continue;
      knownSlugs.add(tool.slug);
      const signal = repoSignals.get(`${tool.githubOwner}/${tool.githubRepo}`.toLowerCase());
      try {
        await syncDiscoveredTool(tool, brewInstalls, {
          source: "github",
          socialScore: signal?.score ?? null,
          socialSource: signal?.source ?? null,
        });
        synced++;
      } catch (err) {
        errors.push(`[discovered] ${tool.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
      touched.add(tool.slug);
      await new Promise((r) => setTimeout(r, 150));
    }
  } catch (err) {
    errors.push(`[discovery] ${err instanceof Error ? err.message : String(err)}`);
  }

  // 2) Social repo hits (HN/PH/Reddit github links) not yet tracked — these are
  //    virally hot before they fit any GitHub-topic taxonomy.
  for (const [key, signal] of repoSignals) {
    const [owner, repo] = key.split("/");
    if (!owner || !repo) continue;
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
      await syncDiscoveredTool(dt, brewInstalls, {
        source: signal.source,
        socialScore: signal.score,
        socialSource: signal.source,
      });
      synced++;
    } catch (err) {
      errors.push(`[social-repo] ${owner}/${repo}: ${err instanceof Error ? err.message : String(err)}`);
    }
    touched.add(slug);
    await new Promise((r) => setTimeout(r, 150));
  }

  // 3) Refresh already-known discovered repos so their stars/created-date/velocity
  //    and eligibility re-evaluate each run (otherwise a repo inserted once would
  //    never update — and its objective newness/growth would never be learned).
  try {
    const existingRepos = await db.query.tools.findMany({
      columns: { slug: true, githubOwner: true, githubRepo: true, githubTopics: true },
      where: eq(tools.kind, "repo"),
    });
    for (const row of existingRepos) {
      if (curatedSlugs.has(row.slug) || touched.has(row.slug)) continue;
      if (!row.githubOwner || !row.githubRepo) continue;
      const signal = repoSignals.get(`${row.githubOwner}/${row.githubRepo}`.toLowerCase());
      const dt: DiscoveredTool = {
        slug: row.slug,
        name: row.githubRepo,
        description: null,
        githubOwner: row.githubOwner,
        githubRepo: row.githubRepo,
        stars: 0,
        pushedAt: new Date().toISOString(),
        topics: row.githubTopics ?? [],
        // Re-derive from topics; empty => setToolCategories preserves existing.
        categories: inferCategories(row.githubTopics ?? []),
      };
      try {
        await syncDiscoveredTool(dt, brewInstalls, {
          source: "github",
          socialScore: signal?.score ?? null,
          socialSource: signal?.source ?? null,
        });
        synced++;
      } catch (err) {
        errors.push(`[refresh] ${row.slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
      touched.add(row.slug);
      await new Promise((r) => setTimeout(r, 120));
    }
  } catch (err) {
    errors.push(`[refresh-pass] ${err instanceof Error ? err.message : String(err)}`);
  }

  // 4) Product launches with no public repo (Stitch-class) — these can only ever
  //    appear because of this path.
  for (const product of social.products) {
    const slug = toSlug(product.name);
    if (!slug || knownSlugs.has(slug)) continue;
    knownSlugs.add(slug);
    try {
      await syncProduct(product);
      synced++;
    } catch (err) {
      errors.push(`[product] ${slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { synced, errors };
}

async function upsertCategories() {
  for (const cat of CURATED_CATEGORIES) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, cat.slug),
    });
    if (existing) {
      await db.update(categories).set({ label: cat.label, iconName: cat.iconName, sortOrder: cat.sortOrder }).where(eq(categories.slug, cat.slug));
    } else {
      await db.insert(categories).values({ id: randomUUID(), ...cat });
    }
  }
}

/** Assign a tool's category associations (replaces any existing ones). No-op on
 *  an empty list so a metrics refresh never wipes existing associations. */
async function setToolCategories(toolId: string, catSlugs: string[]) {
  if (catSlugs.length === 0) return;
  const catRecords = await db.query.categories.findMany();
  const catMap = new Map(catRecords.map((c) => [c.slug, c.id]));
  await db.delete(toolCategories).where(eq(toolCategories.toolId, toolId));
  for (const catSlug of catSlugs) {
    const catId = catMap.get(catSlug);
    if (catId) await db.insert(toolCategories).values({ toolId, categoryId: catId });
  }
}

async function syncTool(
  tool: (typeof CURATED_TOOLS)[number],
  brewInstalls: Map<string, number>,
  repoSignals: Map<string, RepoSignal>
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
  const signal = hasGitHub
    ? repoSignals.get(`${tool.githubOwner}/${tool.githubRepo}`.toLowerCase())
    : undefined;

  const existing = await db.query.tools.findFirst({ where: eq(tools.slug, tool.slug) });
  const toolId = existing?.id ?? randomUUID();
  const firstSeenAt = existing?.firstSeenAt ?? new Date();

  // Carry forward the last social signal unless a fresher one arrived this run.
  const socialScore = signal?.score ?? existing?.socialScore ?? null;
  const socialSource = signal?.source ?? existing?.socialSource ?? null;
  const lastSignalAt = signal ? new Date() : (existing?.lastSignalAt ?? null);

  const githubCreatedAt = githubData?.created_at
    ? new Date(githubData.created_at)
    : (existing?.githubCreatedAt ?? null);

  const starGrowthPct7d = existing ? await computeStarGrowthPct7d(toolId, stars) : null;
  const trendingScore = computeTrendingScore({ stars, pushedAt, starGrowthPct7d, socialScore, repoCreatedAt: githubCreatedAt, kind: "repo" });
  const trendingEligible = computeTrendingEligible({
    kind: "repo",
    repoCreatedAt: githubCreatedAt,
    firstSeenAt,
    starGrowthPct7d,
    lastSignalAt,
  });

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
    githubCreatedAt,
    brewName: tool.brewName ?? null,
    brewUrl: tool.brewName ? `https://formulae.brew.sh/formula/${tool.brewName}` : null,
    installsLast30d,
    currentVersion: brewData?.versions?.stable ?? null,
    featured: tool.featured ?? false,
    trendingScore,
    starGrowthPct7d,
    kind: "repo" as const,
    source: "curated" as const,
    trendingEligible,
    socialScore,
    socialSource,
    lastSignalAt,
    updatedAt: new Date(),
    dataFetchedAt: new Date(),
  };

  if (existing) {
    await db.update(tools).set(toolData).where(eq(tools.slug, tool.slug));
  } else {
    await db.insert(tools).values({ id: toolId, firstSeenAt, ...toolData });
  }

  await snapshotMetrics(toolId, { stars, forks, installsLast30d });
  await setToolCategories(toolId, tool.categories);
}

async function syncDiscoveredTool(
  tool: DiscoveredTool,
  brewInstalls: Map<string, number>,
  opts: { source: SocialSource | "github"; socialScore?: number | null; socialSource?: SocialSource | null }
) {
  const githubData = await fetchGitHubRepo(tool.githubOwner, tool.githubRepo);
  const existing = await db.query.tools.findFirst({ where: eq(tools.slug, tool.slug) });

  // On a transient GitHub failure, preserve existing values rather than the
  // discovery placeholder (refresh passes pass stars=0), so we never regress data.
  const stars = githubData?.stargazers_count ?? existing?.stars ?? tool.stars;
  const forks = githubData?.forks_count ?? existing?.forks ?? 0;
  const pushedAt = githubData?.pushed_at ?? existing?.lastPushedAt?.toISOString() ?? tool.pushedAt;
  const githubUrl = `https://github.com/${tool.githubOwner}/${tool.githubRepo}`;

  const toolId = existing?.id ?? randomUUID();
  const firstSeenAt = existing?.firstSeenAt ?? new Date();

  const socialScore = opts.socialScore ?? existing?.socialScore ?? null;
  const socialSource = opts.socialSource ?? existing?.socialSource ?? null;
  const lastSignalAt = opts.socialScore != null ? new Date() : (existing?.lastSignalAt ?? null);
  const githubCreatedAt = githubData?.created_at
    ? new Date(githubData.created_at)
    : (existing?.githubCreatedAt ?? null);

  const starGrowthPct7d = existing ? await computeStarGrowthPct7d(toolId, stars) : null;
  const trendingScore = computeTrendingScore({ stars, pushedAt, starGrowthPct7d, socialScore, repoCreatedAt: githubCreatedAt, kind: "repo" });
  const trendingEligible = computeTrendingEligible({
    kind: "repo",
    repoCreatedAt: githubCreatedAt,
    firstSeenAt,
    starGrowthPct7d,
    lastSignalAt,
  });

  const metricUpdate = {
    stars,
    forks,
    openIssues: githubData?.open_issues_count ?? 0,
    lastPushedAt: pushedAt ? new Date(pushedAt) : null,
    githubCreatedAt,
    trendingScore,
    starGrowthPct7d,
    trendingEligible,
    socialScore,
    socialSource,
    lastSignalAt,
    updatedAt: new Date(),
    dataFetchedAt: new Date(),
  };

  if (existing) {
    // Only update metrics/source for discovered tools; don't overwrite metadata.
    await db.update(tools).set({ source: opts.source, ...metricUpdate }).where(eq(tools.slug, tool.slug));
  } else {
    await db.insert(tools).values({
      id: toolId,
      slug: tool.slug,
      name: githubData ? tool.githubRepo : tool.name,
      description: githubData?.description || tool.description || "",
      githubOwner: tool.githubOwner,
      githubRepo: tool.githubRepo,
      githubUrl,
      websiteUrl: githubUrl,
      githubTopics: githubData?.topics ?? tool.topics,
      brewName: null,
      brewUrl: null,
      installsLast30d: 0,
      currentVersion: null,
      featured: false,
      kind: "repo",
      source: opts.source,
      firstSeenAt,
      ...metricUpdate,
    });
  }

  await snapshotMetrics(toolId, { stars, forks, installsLast30d: 0 });
  await setToolCategories(toolId, tool.categories);
}

// Map a product launch to category slugs from its topics/title keywords.
function inferProductCategories(hit: ProductHit): string[] {
  const hay = `${hit.name} ${hit.tagline} ${hit.topics.join(" ")}`.toLowerCase();
  const cats = new Set<string>();
  if (/\b(ai|llm|agent|copilot|gpt|model)\b/.test(hay)) cats.add("ai-coding");
  if (/\b(editor|ide|code\s*editor)\b/.test(hay)) cats.add("editors");
  if (/\bterminal\b/.test(hay)) cats.add("terminals");
  if (/\b(git|version control)\b/.test(hay)) cats.add("version-control");
  if (/\b(docker|container)\b/.test(hay)) cats.add("containers");
  if (cats.size === 0) cats.add("productivity");
  return [...cats];
}

async function syncProduct(hit: ProductHit) {
  const slug = toSlug(hit.name);
  if (!slug) return;

  const existing = await db.query.tools.findFirst({ where: eq(tools.slug, slug) });
  const toolId = existing?.id ?? randomUUID();
  const firstSeenAt = existing?.firstSeenAt ?? new Date();
  const lastSignalAt = new Date();

  const trendingScore = computeTrendingScore({
    stars: 0,
    starGrowthPct7d: null,
    socialScore: hit.socialScore,
    firstSeenAt,
    kind: "product",
  });
  const trendingEligible = computeTrendingEligible({
    kind: "product",
    firstSeenAt,
    lastSignalAt,
  });

  const toolData = {
    slug,
    name: hit.name,
    description: hit.tagline,
    githubOwner: null,
    githubRepo: null,
    githubUrl: null,
    websiteUrl: hit.url,
    stars: 0,
    forks: 0,
    openIssues: 0,
    githubTopics: [],
    lastPushedAt: null,
    brewName: null,
    brewUrl: null,
    installsLast30d: 0,
    currentVersion: null,
    featured: false,
    trendingScore,
    starGrowthPct7d: null,
    kind: "product" as const,
    source: hit.source,
    trendingEligible,
    socialScore: hit.socialScore,
    socialSource: hit.source,
    lastSignalAt,
    updatedAt: new Date(),
    dataFetchedAt: new Date(),
  };

  if (existing) {
    await db.update(tools).set(toolData).where(eq(tools.slug, slug));
  } else {
    await db.insert(tools).values({ id: toolId, firstSeenAt, ...toolData });
  }

  await setToolCategories(toolId, inferProductCategories(hit));
}

export { upsertCategories };
