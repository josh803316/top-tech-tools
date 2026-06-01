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
  created_at: string;
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
function ageInDays(d: string | Date | null | undefined): number | null {
  if (d == null) return null;
  const ms = d instanceof Date ? d.getTime() : new Date(d).getTime();
  if (!Number.isFinite(ms)) return null;
  return (Date.now() - ms) / 86_400_000;
}

export function computeTrendingScore(input: {
  stars: number;
  pushedAt?: string | null;
  starGrowthPct7d?: number | null;
  socialScore?: number | null;
  firstSeenAt?: string | Date | null;
  repoCreatedAt?: string | Date | null;
  kind?: "repo" | "product";
  phRank?: number | null;
}): number {
  const { stars, starGrowthPct7d, socialScore, firstSeenAt, repoCreatedAt, kind, phRank } = input;

  const safeStars = Number.isFinite(stars) && stars > 0 ? stars : 0;
  const repoAge = ageInDays(repoCreatedAt);
  const isNewRepo = repoAge != null && repoAge <= NEW_REPO_WINDOW_DAYS;

  // 1) Growth term (dominant when present). +1% weekly growth = +2; clamped.
  let growthTerm = 0;
  if (starGrowthPct7d != null && Number.isFinite(starGrowthPct7d)) {
    const g = Math.max(-50, Math.min(starGrowthPct7d, 500));
    growthTerm = g * 2;
  }

  // 2) Social term. Normalized 0..100 heat, weighted < 1 so a single source can't
  //    dwarf real GitHub traction; PH rank folds in when no explicit score given.
  let effectiveSocial = 0;
  if (socialScore != null && Number.isFinite(socialScore)) {
    effectiveSocial = Math.max(0, Math.min(socialScore, 100));
  } else if (phRank != null) {
    effectiveSocial = phRankToSocialScore(phRank);
  }
  const socialTerm = effectiveSocial * 0.6;

  // 3) Freshness term. Decays from ~25 over weeks. Anchored on repo creation for
  //    repos (objective newness) and on first-seen for repo-less products.
  const anchor = kind === "product" ? firstSeenAt : (repoCreatedAt ?? firstSeenAt);
  const anchorAge = ageInDays(anchor);
  const freshnessTerm = anchorAge != null ? 25 / (Math.max(anchorAge, 0) / 7 + 1) : 0;

  // 4) Traction. A genuinely NEW repo with real stars is a strong signal, so let
  //    its (log-damped) stars count for something — but only while it's new. Once
  //    a repo ages out, stars collapse to a tiny tiebreak so size never dominates.
  const tractionTerm = isNewRepo ? Math.log10(safeStars + 1) * 8 : 0;
  const starTie = isNewRepo ? 0 : Math.log10(safeStars + 1) * 0.5;

  return growthTerm + socialTerm + freshnessTerm + tractionTerm + starTie;
}

// --- Trending eligibility (newcomer gate) -----------------------------------

/** A repo counts as a "newcomer" while its GitHub repo is younger than this. */
export const NEW_REPO_WINDOW_DAYS = 180;
/** A repo-less product stays in Trending while first-seen within this window. */
export const TRENDING_WINDOW_DAYS = 120;
/** A fresh social signal keeps a tool in Trending for this long (days). */
export const SIGNAL_WINDOW_DAYS = 30;
/** 7-day star growth at/above this % counts as "surging". */
export const SURGING_VELOCITY_PCT = 15;

/**
 * Decide whether a tool belongs on the Trending (newcomer) surface — distinct
 * from the full Explore catalog.
 *
 *   - Repos: in if the GitHub repo is genuinely young (objective, immune to when
 *     WE happened to discover it), OR surging in stars, OR freshly hot on a
 *     social source. This keeps old staples (VS Code, Oh My Zsh) out while a
 *     weeks-old rocket like terax-ai is in, regardless of its `source` label.
 *   - Products (no repo): in while recently first-seen or carrying a fresh signal.
 */
export function computeTrendingEligible(input: {
  kind: "repo" | "product";
  repoCreatedAt?: string | Date | null;
  firstSeenAt: string | Date;
  starGrowthPct7d?: number | null;
  lastSignalAt?: string | Date | null;
}): boolean {
  const { kind, repoCreatedAt, firstSeenAt, starGrowthPct7d, lastSignalAt } = input;

  const isSurging =
    starGrowthPct7d != null &&
    Number.isFinite(starGrowthPct7d) &&
    starGrowthPct7d >= SURGING_VELOCITY_PCT;
  const signalAge = ageInDays(lastSignalAt);
  const hasFreshSignal = signalAge != null && signalAge <= SIGNAL_WINDOW_DAYS;

  if (kind === "product") {
    const seenAge = ageInDays(firstSeenAt);
    const isYoung = seenAge != null && seenAge <= TRENDING_WINDOW_DAYS;
    return isYoung || hasFreshSignal;
  }

  const repoAge = ageInDays(repoCreatedAt);
  const isNewRepo = repoAge != null && repoAge <= NEW_REPO_WINDOW_DAYS;
  return isNewRepo || isSurging || hasFreshSignal;
}
