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
    "topic:shell topic:zsh",
    "topic:bash-framework",
    "topic:fish-shell",
    "topic:terminal-multiplexer",
    "topic:shell-history",
    "topic:prompt",
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

async function searchGitHub(query: string): Promise<GitHubSearchItem[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }

  const encoded = encodeURIComponent(`${query} stars:>${MIN_STARS} fork:false`);
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
 * Infer which categories a repo belongs to based on its GitHub topics.
 * Always includes the category from the originating query.
 */
function inferCategories(topics: string[], originCategory: string): string[] {
  const cats = new Set<string>([originCategory]);

  const topicSet = new Set(topics.map((t) => t.toLowerCase()));

  if (topicSet.has("zsh") || topicSet.has("bash") || topicSet.has("fish-shell") || topicSet.has("shell")) {
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
