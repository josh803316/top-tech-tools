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
 * Map a Product Hunt rank (1 = best) to a normalized 0..100 social score.
 * #1 → 100, fading ~2 points per rank, floored at 0 beyond the top ~50.
 */
export function phRankToSocialScore(phRank: number): number {
  if (!Number.isFinite(phRank) || phRank < 1) return 0;
  return Math.max(0, 100 - (phRank - 1) * 2);
}

/**
 * Blended trending score for the NEWCOMER surface. Higher = hotter right now.
 *
 * Trending is explicitly NOT Explore: it rewards MOMENTUM, CROSS-SOURCE HEAT, and
 * FRESHNESS — never raw size. Raw stars are demoted to a tiny tiebreak so a flat
 * mega-repo can't float to the top, and a brand-new product with zero GitHub stars
 * can still win on social heat alone. Additive terms degrade gracefully as signals
 * appear/disappear:
 *
 *   1. growthTerm   (dominant): 7-day star-growth %, the truest velocity signal.
 *   2. socialTerm   (dominant): normalized 0..100 cross-source heat (PH votes /
 *      HN points / Reddit upvotes). Lets products with no repo rank.
 *   3. freshnessTerm: decays with days since we first discovered it, so a freshly
 *      surfaced tool surfaces immediately — before any velocity history exists.
 *   4. starTie      (tiny): log-damped stars * 0.5, breaks ties only.
 *
 * `phRank` is accepted as a convenience alias and folded into the social term.
 */
export function computeTrendingScore(input: {
  stars: number;
  pushedAt: string | null;
  starGrowthPct7d?: number | null;
  socialScore?: number | null;
  firstSeenAt?: string | Date | null;
  phRank?: number | null;
}): number {
  const { stars, starGrowthPct7d, socialScore, firstSeenAt, phRank } = input;

  const safeStars = Number.isFinite(stars) && stars > 0 ? stars : 0;
  // Tiny tiebreak only — never a ranking driver. ~1.9 at 6k stars.
  const starTie = Math.log10(safeStars + 1) * 0.5;

  // 1) Growth term (dominant). Each +1% weekly growth adds a meaningful chunk.
  //    Clamp to avoid a single anomalous data point exploding the score.
  let growthTerm = 0;
  if (starGrowthPct7d != null && Number.isFinite(starGrowthPct7d)) {
    const g = Math.max(-50, Math.min(starGrowthPct7d, 500));
    growthTerm = g * 2;
  }

  // 2) Social term (dominant). Normalized 0..100 cross-source heat; PH rank folds
  //    in when an explicit socialScore wasn't supplied.
  let effectiveSocial = 0;
  if (socialScore != null && Number.isFinite(socialScore)) {
    effectiveSocial = Math.max(0, Math.min(socialScore, 100));
  } else if (phRank != null) {
    effectiveSocial = phRankToSocialScore(phRank);
  }
  const socialTerm = effectiveSocial;

  // 3) Freshness term. Decays from ~25 (just discovered) toward 0 over weeks, so a
  //    newly surfaced tool ranks even before velocity/social data accrues.
  let freshnessTerm = 0;
  if (firstSeenAt != null) {
    const seen = firstSeenAt instanceof Date ? firstSeenAt.getTime() : new Date(firstSeenAt).getTime();
    const days = (Date.now() - seen) / 86_400_000;
    if (Number.isFinite(days)) {
      freshnessTerm = 25 / (Math.max(days, 0) / 7 + 1);
    }
  }

  return growthTerm + socialTerm + freshnessTerm + starTie;
}

// --- Trending eligibility (newcomer gate) -----------------------------------

/** A discovered tool stays in Trending while it's this young (days). */
export const TRENDING_WINDOW_DAYS = 120;
/** A fresh social signal keeps a tool in Trending for this long (days). */
export const SIGNAL_WINDOW_DAYS = 30;
/** 7-day star growth at/above this % counts as "surging". */
export const SURGING_VELOCITY_PCT = 15;

/**
 * Decide whether a tool belongs on the Trending (newcomer) surface.
 *
 * Trending is deliberately distinct from Explore:
 *   - Products (no repo) are in while young or freshly hot on a social source.
 *   - Curated ecosystem staples are EXCLUDED unless they're genuinely surging —
 *     this is what keeps VS Code / Oh My Zsh out of Trending.
 *   - Anything we discovered (github crawl / HN / PH / Reddit) is in while young,
 *     surging, or carrying a fresh social signal; it "graduates" to Explore-only
 *     once it ages out and cools off.
 */
export function computeTrendingEligible(input: {
  kind: "repo" | "product";
  source: "curated" | "github" | "hackernews" | "producthunt" | "reddit";
  firstSeenAt: string | Date;
  starGrowthPct7d?: number | null;
  lastSignalAt?: string | Date | null;
}): boolean {
  const { kind, source, firstSeenAt, starGrowthPct7d, lastSignalAt } = input;
  const now = Date.now();
  const ageDays = (now - new Date(firstSeenAt).getTime()) / 86_400_000;

  const isYoung = Number.isFinite(ageDays) && ageDays <= TRENDING_WINDOW_DAYS;
  const isSurging =
    starGrowthPct7d != null &&
    Number.isFinite(starGrowthPct7d) &&
    starGrowthPct7d >= SURGING_VELOCITY_PCT;
  const hasFreshSignal =
    lastSignalAt != null &&
    (now - new Date(lastSignalAt).getTime()) / 86_400_000 <= SIGNAL_WINDOW_DAYS;

  if (kind === "product") return isYoung || hasFreshSignal;
  if (source === "curated") return isSurging; // staples only when truly hot
  return isYoung || isSurging || hasFreshSignal;
}
