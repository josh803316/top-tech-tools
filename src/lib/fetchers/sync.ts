import { db } from "@/lib/db";
import { tools, categories, toolCategories } from "@/lib/db/schema";
import { CURATED_TOOLS, CURATED_CATEGORIES } from "@/lib/seed/curated-tools";
import { fetchGitHubRepo, computeTrendingScore } from "./github";
import { fetchBrewFormula, getBrewInstalls30d } from "./brew";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function syncAllTools(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];

  await upsertCategories();

  const brewInstalls = await getBrewInstalls30d();

  let synced = 0;
  for (const tool of CURATED_TOOLS) {
    try {
      await syncTool(tool, brewInstalls);
      synced++;
    } catch (err) {
      errors.push(`${tool.slug}: ${err instanceof Error ? err.message : String(err)}`);
    }
    // Stagger to avoid GitHub rate limit bursts
    await new Promise((r) => setTimeout(r, 150));
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
  brewInstalls: Map<string, number>
) {
  const hasGitHub = !!tool.githubOwner && !!tool.githubRepo;

  const [githubData, brewData] = await Promise.all([
    hasGitHub
      ? fetchGitHubRepo(tool.githubOwner!, tool.githubRepo!)
      : Promise.resolve(null),
    tool.brewName ? fetchBrewFormula(tool.brewName) : Promise.resolve(null),
  ]);

  const stars = githubData?.stargazers_count ?? 0;
  const pushedAt = githubData?.pushed_at ?? null;
  const trendingScore = computeTrendingScore(stars, pushedAt);
  const installsLast30d = tool.brewName ? (brewInstalls.get(tool.brewName) ?? 0) : 0;

  const githubUrl = githubData?.html_url
    ?? (hasGitHub ? `https://github.com/${tool.githubOwner}/${tool.githubRepo}` : null);

  const toolData = {
    slug: tool.slug,
    name: tool.name,
    description: githubData?.description || tool.description,
    githubOwner: tool.githubOwner ?? null,
    githubRepo: tool.githubRepo ?? null,
    githubUrl,
    websiteUrl: tool.websiteUrl ?? githubUrl ?? null,
    stars,
    forks: githubData?.forks_count ?? 0,
    openIssues: githubData?.open_issues_count ?? 0,
    githubTopics: githubData?.topics ?? [],
    lastPushedAt: pushedAt ? new Date(pushedAt) : null,
    brewName: tool.brewName ?? null,
    brewUrl: tool.brewName ? `https://formulae.brew.sh/formula/${tool.brewName}` : null,
    installsLast30d,
    currentVersion: brewData?.versions?.stable ?? null,
    featured: tool.featured ?? false,
    trendingScore,
    updatedAt: new Date(),
    dataFetchedAt: new Date(),
  };

  const existing = await db.query.tools.findFirst({
    where: eq(tools.slug, tool.slug),
  });

  let toolId: string;
  if (existing) {
    await db.update(tools).set(toolData).where(eq(tools.slug, tool.slug));
    toolId = existing.id;
  } else {
    toolId = randomUUID();
    await db.insert(tools).values({ id: toolId, ...toolData });
  }

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
