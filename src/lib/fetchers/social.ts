/**
 * Shared shapes for web-grounded ("social") discovery sources — Hacker News,
 * Product Hunt and Reddit. Each source can surface two kinds of hit:
 *
 *   - RepoHit:    the post links straight to a github.com/owner/repo, so we can
 *                 fold it into the normal repo-enrichment pipeline.
 *   - ProductHit: the post is a dev-tool launch with NO public repo (a landing
 *                 page, a hosted product). These become `kind: "product"` rows so
 *                 things like Stitch / a hosted design tool can appear in Trending.
 *
 * `socialScore` is normalized 0..100 cross-source heat so the trending score can
 * compare a #1 Product Hunt launch against a high-point Show HN against a viral
 * Reddit thread on one axis.
 */

export type SocialSource = "hackernews" | "producthunt" | "reddit";

export type RepoHit = {
  owner: string;
  repo: string;
  source: SocialSource;
  socialScore: number;
};

export type ProductHit = {
  name: string;
  tagline: string;
  url: string;
  source: SocialSource;
  socialScore: number;
  topics: string[];
};

/** Hacker News points → 0..100 (≈1000 points saturates). */
export function hnPointsToSocialScore(points: number): number {
  if (!Number.isFinite(points) || points <= 0) return 0;
  return Math.min(100, points / 10);
}

/** Reddit upvotes → 0..100 (≈5000 upvotes saturates). */
export function redditUpsToSocialScore(ups: number): number {
  if (!Number.isFinite(ups) || ups <= 0) return 0;
  return Math.min(100, ups / 50);
}
