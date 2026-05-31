export type GitHubRepoData = {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  pushed_at: string;
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function fetchGitHubRepo(
  owner: string,
  repo: string
): Promise<GitHubRepoData | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 3600 },
    });

    if (res.status === 404) return null;

    const remaining = res.headers.get("X-RateLimit-Remaining");
    if (res.status === 403 || res.status === 429 || (remaining && parseInt(remaining) === 0)) {
      console.warn(`GitHub rate limit hit for ${owner}/${repo}`);
      return null;
    }

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Blended, velocity-weighted trending score. Higher = more trending.
 *
 * Rationale: trending should reward MOMENTUM and CROSS-SOURCE CONSENSUS, not raw
 * size or pure recency. A huge but flat repo that happens to have a recent commit
 * should NOT outrank a smaller repo that's actually accelerating. We blend three
 * additive terms so the score degrades gracefully as signals appear/disappear:
 *
 *   1. growthTerm   (DOMINANT when present): 7-day star-growth percent. This is the
 *      truest velocity signal — when we have it, it should drive the ranking.
 *   2. activityTerm (weak): a recency signal from pushedAt, intentionally capped and
 *      log-damped so a fresh push can nudge but never auto-top a real grower.
 *   3. phBonus      (consensus): a Product Hunt placement bonus — a second source
 *      agreeing a tool is hot. Better (smaller) phRank => bigger bonus.
 *
 * Fallback: when growth & phRank are both null we still produce a sane, finite,
 * positive number from a log-damped stars base + the (weak) activity term — NOT a
 * pure-recency score, so big-but-stale repos don't rocket on a single commit.
 */
export function computeTrendingScore(input: {
  stars: number;
  pushedAt: string | null;
  starGrowthPct7d?: number | null;
  phRank?: number | null;
}): number {
  const { stars, pushedAt, starGrowthPct7d, phRank } = input;

  const safeStars = Number.isFinite(stars) && stars > 0 ? stars : 0;
  // Log-damped popularity base: keeps mega-repos from dominating purely on size,
  // but still lets stars break ties. ~ 0..3+ for 0..thousands of stars.
  const starBase = Math.log10(safeStars + 1);

  // 1) Growth term (dominant). Each +1% weekly growth adds a meaningful chunk.
  //    Clamp to avoid a single anomalous data point exploding the score.
  let growthTerm = 0;
  if (starGrowthPct7d != null && Number.isFinite(starGrowthPct7d)) {
    const g = Math.max(-50, Math.min(starGrowthPct7d, 500));
    growthTerm = g * 2; // dominant weight
  }

  // 2) Activity term (weak). Decays with days since last push; capped so a fresh
  //    commit alone can't top a real grower. Scaled by the log star base so a tiny
  //    abandoned repo with a recent commit stays near the bottom.
  let activityTerm = 0;
  if (pushedAt) {
    const days = (Date.now() - new Date(pushedAt).getTime()) / 86_400_000;
    if (Number.isFinite(days)) {
      // ~10 at 0 days, ~5 at ~30 days, trailing off; weak vs. growth*2.
      const recency = 10 / Math.pow(Math.max(days, 0) / 30 + 1, 1.2);
      activityTerm = recency * (0.5 + 0.5 * Math.min(starBase, 3) / 3);
    }
  }

  // 3) Product Hunt consensus bonus. #1 best; bonus shrinks with worse rank,
  //    zero beyond the top ~50. Multi-source agreement that a tool is hot.
  let phBonus = 0;
  if (phRank != null && Number.isFinite(phRank) && phRank >= 1) {
    phBonus = Math.max(0, 50 - (phRank - 1));
  }

  return growthTerm + activityTerm + phBonus + starBase;
}
