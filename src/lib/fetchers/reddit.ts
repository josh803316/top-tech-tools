/**
 * Web-grounded discovery via Reddit's public JSON listings (no API key).
 *
 * Pulls the week's top posts from a handful of dev-tool subreddits. Posts that
 * link directly to a github.com repo become RepoHits; other dev-tool-ish posts
 * (a launch, a hosted product) become ProductHits. Reddit rate-limits aggressively
 * and 403s requests without a descriptive User-Agent, so we always send one.
 */

import {
  type ProductHit,
  type RepoHit,
  redditUpsToSocialScore,
} from "./social";

// Subreddits where new developer tools tend to debut / get discussed.
const SUBREDDITS = [
  "programming",
  "commandline",
  "devtools",
  "webdev",
  "selfhosted",
  "rust",
  "neovim",
];

const USER_AGENT =
  "top-tech-tools/1.0 (+https://top-tech-tools.vercel.app) discovery bot";

type RedditPost = {
  title: string;
  url: string | null;
  ups: number | null;
  is_self: boolean;
  domain: string | null;
  link_flair_text: string | null;
};

type RedditListing = {
  data?: { children?: Array<{ data: RedditPost }> };
};

/** Extract normalized `https://github.com/owner/repo` or null. */
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
    if (!owner || !repo) return null;
    return `https://github.com/${owner}/${repo.replace(/\.git$/, "")}`;
  } catch {
    return null;
  }
}

// Words that mark a non-repo link post as plausibly a developer tool/product.
const DEV_TOOL_KEYWORDS = [
  "tool",
  "cli",
  "terminal",
  "editor",
  "ide",
  "ai",
  "agent",
  "framework",
  "library",
  "sdk",
  "devtool",
  "developer",
  "self-host",
  "selfhosted",
  "open source",
  "open-source",
  "launch",
  "built",
  "made",
  "introducing",
];

function looksLikeDevTool(title: string): boolean {
  const lower = title.toLowerCase();
  return DEV_TOOL_KEYWORDS.some((kw) => lower.includes(kw));
}

// Link domains that are aggregators / not a product in their own right.
const SKIP_DOMAINS = ["youtube.com", "youtu.be", "twitter.com", "x.com", "reddit.com"];

async function fetchSubredditTop(
  sub: string,
  minUps: number
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${sub}/top.json?t=week&limit=50`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      console.warn(`[reddit] r/${sub} error: ${res.status}`);
      return [];
    }
    const data = (await res.json()) as RedditListing;
    const posts = (data.data?.children ?? []).map((c) => c.data);
    return posts.filter((p) => (p.ups ?? 0) >= minUps);
  } catch {
    return [];
  }
}

/**
 * Discover dev-tool candidates from Reddit's weekly top posts.
 *
 * @param opts.minUps - Minimum upvotes (default 200).
 * @returns repo hits (github links) and product hits (everything else dev-toolish).
 */
export async function discoverFromReddit(
  opts?: { minUps?: number }
): Promise<{ repos: RepoHit[]; products: ProductHit[] }> {
  const minUps = opts?.minUps ?? 200;
  const repos: RepoHit[] = [];
  const products: ProductHit[] = [];
  const seenRepo = new Set<string>();
  const seenProduct = new Set<string>();

  for (const sub of SUBREDDITS) {
    await new Promise((r) => setTimeout(r, 300));
    const posts = await fetchSubredditTop(sub, minUps);

    for (const post of posts) {
      if (post.is_self || !post.url) continue;
      const ups = post.ups ?? 0;
      const socialScore = redditUpsToSocialScore(ups);

      const gh = extractGithubUrl(post.url);
      if (gh) {
        const m = gh.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
        if (!m) continue;
        const owner = m[1];
        const repo = m[2];
        if (!owner || !repo) continue;
        const key = `${owner}/${repo}`.toLowerCase();
        if (seenRepo.has(key)) continue;
        seenRepo.add(key);
        repos.push({ owner, repo, source: "reddit", socialScore });
        continue;
      }

      // Non-repo link: only keep clearly dev-tool-ish launches.
      const domain = (post.domain ?? "").toLowerCase();
      if (SKIP_DOMAINS.some((d) => domain.includes(d))) continue;
      if (!looksLikeDevTool(post.title)) continue;

      let host: string;
      try {
        host = new URL(post.url).hostname.replace(/^www\./, "");
      } catch {
        continue;
      }
      if (seenProduct.has(host)) continue;
      seenProduct.add(host);
      products.push({
        name: post.title.slice(0, 80),
        tagline: post.title,
        url: post.url,
        source: "reddit",
        socialScore,
        topics: post.link_flair_text ? [post.link_flair_text] : [],
      });
    }
  }

  return { repos, products };
}
