/**
 * Web-grounded discovery via the Algolia Hacker News Search API.
 *
 * GitHub-topic discovery only surfaces tools once they fit a topic taxonomy.
 * HN surfaces virally-trending tools earlier — a "Show HN" or high-point story
 * often precedes broad topic adoption. We pull recent high-point stories,
 * keep the dev-tool-ish ones, and extract a github.com URL when the story
 * links directly to a repo so the integrator can fold them into discovery.
 *
 * No API key required: https://hn.algolia.com/api/v1/search
 */

const HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search";

export type HNCandidate = {
  title: string;
  url: string | null;
  githubUrl: string | null;
  points: number;
  numComments: number;
};

type AlgoliaHit = {
  title: string | null;
  url: string | null;
  points: number | null;
  num_comments: number | null;
};

type AlgoliaResponse = {
  hits: AlgoliaHit[];
};

// Keywords that mark a story as plausibly about a developer tool.
const DEV_TOOL_KEYWORDS = [
  "cli",
  "terminal",
  "shell",
  "editor",
  "vim",
  "neovim",
  "git",
  "docker",
  "kubernetes",
  "tool",
  "tui",
  "developer",
  "dev tool",
  "open source",
  "open-source",
  "command line",
  "command-line",
  "rust",
  "golang",
  "library",
  "framework",
  "sdk",
];

/**
 * Extract a normalized `https://github.com/owner/repo` URL from an arbitrary
 * URL, or null if it isn't a github.com repo link.
 */
export function extractGithubUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
      return null;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const [owner, repo] = parts;
    return `https://github.com/${owner}/${repo}`;
  } catch {
    return null;
  }
}

function looksLikeDevTool(title: string): boolean {
  const lower = title.toLowerCase();
  if (lower.startsWith("show hn")) return true;
  return DEV_TOOL_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Discover virally-trending dev-tool candidates from Hacker News.
 *
 * @param opts.minPoints - Minimum HN points (default 100).
 * @param opts.tags - Algolia `tags` filter (default "story").
 * @returns HNCandidate[] filtered to dev-tool-ish posts; [] on any error.
 */
export async function discoverFromHackerNews(
  opts?: { minPoints?: number; tags?: string }
): Promise<HNCandidate[]> {
  const minPoints = opts?.minPoints ?? 100;
  const tags = opts?.tags ?? "story";

  const params = new URLSearchParams({
    tags,
    numericFilters: `points>${minPoints}`,
    hitsPerPage: "50",
  });
  const url = `${HN_SEARCH_URL}?${params.toString()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      console.warn(`[hackernews] HN search error: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as AlgoliaResponse;
    const hits = data.hits ?? [];

    const candidates: HNCandidate[] = [];
    for (const hit of hits) {
      const title = hit.title;
      if (!title) continue;
      if (!looksLikeDevTool(title)) continue;

      candidates.push({
        title,
        url: hit.url ?? null,
        githubUrl: extractGithubUrl(hit.url),
        points: hit.points ?? 0,
        numComments: hit.num_comments ?? 0,
      });
    }

    return candidates;
  } catch {
    return [];
  }
}
