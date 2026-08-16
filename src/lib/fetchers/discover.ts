/**
 * GitHub topic-based auto-discovery for new tools.
 *
 * Queries the GitHub Search API for highly-starred repos in each category's
 * topic space. Returns candidates not already tracked in the curated list.
 * During nightly refresh, qualifying tools are automatically inserted into
 * the DB so the catalog stays current without manual curation.
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Maps each category slug to one or more GitHub topics to search.
// Each query string is passed directly as the `q` param to GitHub search.
const CATEGORY_TOPIC_QUERIES: Record<string, string[]> = {
  shells: [
    "topic:zsh-plugin",
    "topic:zsh-theme",
    "topic:bash-framework",
    "topic:fish-shell topic:plugin",
    "topic:terminal-multiplexer",
    "topic:shell-history",
    "topic:shell-prompt",
  ],
  terminals: [
    "topic:terminal-emulator",
    "topic:terminal topic:rust",
    "topic:terminal topic:gpu",
  ],
  editors: [
    "topic:neovim-plugin",
    "topic:vim-plugin",
    "topic:text-editor",
  ],
  "ai-coding": [
    "topic:llm topic:coding-assistant",
    "topic:ai-assistant topic:developer-tools",
    "topic:code-generation",
  ],
  "version-control": [
    "topic:git topic:cli",
    "topic:git-workflow",
  ],
  containers: [
    "topic:docker topic:cli",
    "topic:container-runtime",
  ],
  kubernetes: [
    "topic:kubernetes topic:cli",
    "topic:kubectl-plugin",
  ],
  files: [
    "topic:file-manager topic:terminal",
    "topic:cli topic:file-search",
  ],
  search: [
    "topic:fuzzy-finder",
    "topic:grep topic:cli",
    "topic:search topic:cli",
  ],
  system: [
    "topic:system-monitor topic:cli",
    "topic:performance-monitoring topic:terminal",
  ],
  network: [
    "topic:network-tools topic:cli",
    "topic:http-client topic:cli",
  ],
  productivity: [
    "topic:developer-tools topic:cli",
    "topic:terminal-utilities",
  ],
};

// Minimum requirements for a discovered tool to be auto-inserted.
const MIN_STARS = 1000;
const MAX_PUSHED_AGE_DAYS = 548; // ~18 months

// "Rising" discovery: recently-CREATED repos with a much lower star floor, so a
// brand-new tool that's catching fire (e.g. crynta/terax-ai: ~6k stars, weeks old)
// surfaces immediately instead of waiting to clear the 1k-star establishment gate.
const RISING_MIN_STARS = 250;
const RISING_MAX_AGE_DAYS = 120;

export type DiscoveredTool = {
  slug: string;
  name: string;
  description: string | null;
  githubOwner: string;
  githubRepo: string;
  stars: number;
  pushedAt: string;
  topics: string[];
  categories: string[];
};

type GitHubSearchItem = {
  full_name: string;
  name: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
  topics: string[];
  fork: boolean;
};

type GitHubSearchResponse = {
  items: GitHubSearchItem[];
};

function toSlug(repoName: string): string {
  return repoName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function isRecent(pushedAt: string): boolean {
  const ms = Date.now() - new Date(pushedAt).getTime();
  return ms < MAX_PUSHED_AGE_DAYS * 86400000;
}

async function searchGitHub(
  query: string,
  opts?: { minStars?: number; createdAfter?: string }
): Promise<GitHubSearchItem[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }

  const minStars = opts?.minStars ?? MIN_STARS;
  const createdQualifier = opts?.createdAfter ? ` created:>${opts.createdAfter}` : "";
  const encoded = encodeURIComponent(
    `${query} stars:>${minStars} fork:false${createdQualifier}`
  );
  const url = `https://api.github.com/search/repositories?q=${encoded}&sort=stars&order=desc&per_page=30`;

  try {
    const res = await fetch(url, { headers, next: { revalidate: 86400 } });

    const remaining = res.headers.get("X-RateLimit-Remaining");
    if (!res.ok || (remaining && parseInt(remaining) < 5)) {
      console.warn(`[discover] GitHub rate limit or error for query: ${query}`);
      return [];
    }

    const data = (await res.json()) as GitHubSearchResponse;
    return data.items ?? [];
  } catch {
    return [];
  }
}

/**
 * Discover new tools from GitHub that aren't already tracked.
 *
 * @param existingSlugs - Set of slugs already in CURATED_TOOLS (or DB)
 * @returns Array of new tools to insert, deduplicated across queries
 */
export async function discoverNewTools(
  existingSlugs: Set<string>
): Promise<DiscoveredTool[]> {
  const seen = new Set<string>(existingSlugs);
  const results: DiscoveredTool[] = [];

  for (const [category, queries] of Object.entries(CATEGORY_TOPIC_QUERIES)) {
    for (const query of queries) {
      // Stagger requests to respect rate limits
      await new Promise((r) => setTimeout(r, 250));

      const items = await searchGitHub(query);

      for (const item of items) {
        if (item.fork) continue;
        if (!isRecent(item.pushed_at)) continue;
        if (item.stargazers_count < MIN_STARS) continue;

        const [owner, repo] = item.full_name.split("/");
        if (!owner || !repo) continue;
        const slug = toSlug(repo);

        if (seen.has(slug)) continue;
        seen.add(slug);

        // Find all matching categories for this repo based on its topics
        const matchedCategories = inferCategories(item.topics, category);

        results.push({
          slug,
          name: repo,
          description: item.description,
          githubOwner: owner,
          githubRepo: repo,
          stars: item.stargazers_count,
          pushedAt: item.pushed_at,
          topics: item.topics,
          categories: matchedCategories,
        });
      }
    }
  }

  return results;
}

/**
 * Discover RISING new tools: repos created within the last ~120 days that have
 * already cleared a modest star floor. This is the path that catches genuinely
 * new, hot tools before they're established enough for the 1k-star crawl above.
 *
 * @param existingSlugs - Set of slugs already in CURATED_TOOLS (or DB)
 * @returns Array of new tools to insert, deduplicated across queries
 */
export async function discoverRisingRepos(
  existingSlugs: Set<string>
): Promise<DiscoveredTool[]> {
  const seen = new Set<string>(existingSlugs);
  const results: DiscoveredTool[] = [];
  const createdAfter = new Date(Date.now() - RISING_MAX_AGE_DAYS * 86400000)
    .toISOString()
    .slice(0, 10); // YYYY-MM-DD

  for (const [category, queries] of Object.entries(CATEGORY_TOPIC_QUERIES)) {
    for (const query of queries) {
      await new Promise((r) => setTimeout(r, 250));

      const items = await searchGitHub(query, {
        minStars: RISING_MIN_STARS,
        createdAfter,
      });

      for (const item of items) {
        if (item.fork) continue;
        if (item.stargazers_count < RISING_MIN_STARS) continue;

        const [owner, repo] = item.full_name.split("/");
        if (!owner || !repo) continue;
        const slug = toSlug(repo);

        if (seen.has(slug)) continue;
        seen.add(slug);

        results.push({
          slug,
          name: repo,
          description: item.description,
          githubOwner: owner,
          githubRepo: repo,
          stars: item.stargazers_count,
          pushedAt: item.pushed_at,
          topics: item.topics,
          categories: inferCategories(item.topics, category),
        });
      }
    }
  }

  return results;
}

/**
 * Parse `{ owner, repo }` pairs out of a list of github.com URLs.
 *
 * Lets an integrator fold externally-sourced github links (e.g. from
 * Hacker News discovery) into the discovery flow without this module
 * needing to know where the URLs came from. Non-github URLs are skipped;
 * trailing slashes and extra path segments are tolerated; results are
 * deduplicated on `owner/repo`.
 */
export function githubCandidatesFromUrls(
  urls: string[]
): Array<{ owner: string; repo: string }> {
  const seen = new Set<string>();
  const out: Array<{ owner: string; repo: string }> = [];

  for (const raw of urls) {
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      continue;
    }
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") {
      continue;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) continue;

    const owner = parts[0];
    const repo = parts[1]?.replace(/\.git$/, "");
    if (!owner || !repo) continue;
    const key = `${owner}/${repo}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ owner, repo });
  }

  return out;
}

/**
 * Infer which categories a repo belongs to based on its GitHub topics.
 * Includes the originating query's category when provided (topic-crawl path);
 * for externally-sourced candidates (e.g. Hacker News) call without an origin
 * to get purely topic-matched categories.
 */
export function inferCategories(topics: string[], originCategory?: string): string[] {
  const cats = new Set<string>(originCategory ? [originCategory] : []);

  const topicSet = new Set(topics.map((t) => t.toLowerCase()));

  if (topicSet.has("zsh-plugin") || topicSet.has("zsh-theme") || topicSet.has("fish-plugin") || topicSet.has("bash-framework") || topicSet.has("shell-prompt") || topicSet.has("shell-history") || topicSet.has("terminal-multiplexer")) {
    cats.add("shells");
  }
  if (topicSet.has("terminal-emulator") || topicSet.has("terminal")) {
    cats.add("terminals");
  }
  if (topicSet.has("neovim") || topicSet.has("vim") || topicSet.has("text-editor") || topicSet.has("editor")) {
    cats.add("editors");
  }
  if (topicSet.has("git")) {
    cats.add("git");
  }
  if (topicSet.has("docker") || topicSet.has("container")) {
    cats.add("containers");
  }
  if (topicSet.has("kubernetes") || topicSet.has("k8s")) {
    cats.add("kubernetes");
  }
  if (topicSet.has("fuzzy-finder") || topicSet.has("search")) {
    cats.add("search");
  }

  return [...cats];
}
