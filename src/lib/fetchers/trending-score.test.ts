import { test, expect } from "bun:test";
import { computeTrendingScore } from "./github";

const NOW = Date.now();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

test("a high-growth tool outranks a high-star, zero-growth tool", () => {
  const grower = computeTrendingScore({
    stars: 800,
    pushedAt: daysAgo(2),
    starGrowthPct7d: 40,
    phRank: null,
  });
  const flatGiant = computeTrendingScore({
    stars: 90_000,
    pushedAt: daysAgo(2),
    starGrowthPct7d: 0,
    phRank: null,
  });
  expect(grower).toBeGreaterThan(flatGiant);
});

test("a #1 Product Hunt rank boosts the score", () => {
  const base = {
    stars: 1_000,
    pushedAt: daysAgo(10),
    starGrowthPct7d: 5,
  } as const;
  const withoutPh = computeTrendingScore({ ...base, phRank: null });
  const withTopPh = computeTrendingScore({ ...base, phRank: 1 });
  expect(withTopPh).toBeGreaterThan(withoutPh);

  // better (smaller) rank => bigger boost
  const withWorsePh = computeTrendingScore({ ...base, phRank: 30 });
  expect(withTopPh).toBeGreaterThan(withWorsePh);
});

test("graceful fallback: null growth & null phRank yields a finite positive number", () => {
  const score = computeTrendingScore({
    stars: 1_500,
    pushedAt: daysAgo(20),
    starGrowthPct7d: null,
    phRank: null,
  });
  expect(Number.isFinite(score)).toBe(true);
  expect(score).toBeGreaterThan(0);

  // also finite/positive when pushedAt is null too
  const noActivity = computeTrendingScore({
    stars: 300,
    pushedAt: null,
  });
  expect(Number.isFinite(noActivity)).toBe(true);
  expect(noActivity).toBeGreaterThan(0);
});

test("a freshly-pushed but unmaintained-popularity repo no longer auto-tops a real grower", () => {
  // Big star count, just pushed, but flat growth — the old recency-biased score
  // would rocket this to the top. It must NOT outrank a genuine accelerator.
  const freshButFlat = computeTrendingScore({
    stars: 50_000,
    pushedAt: daysAgo(0),
    starGrowthPct7d: 0,
    phRank: null,
  });
  const realGrower = computeTrendingScore({
    stars: 2_000,
    pushedAt: daysAgo(5),
    starGrowthPct7d: 25,
    phRank: null,
  });
  expect(realGrower).toBeGreaterThan(freshButFlat);
});
