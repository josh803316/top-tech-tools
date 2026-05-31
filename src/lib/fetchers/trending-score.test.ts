import { test, expect } from "bun:test";
import {
  computeTrendingScore,
  computeTrendingEligible,
  SURGING_VELOCITY_PCT,
  TRENDING_WINDOW_DAYS,
} from "./github";

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

test("a zero-star product with high social heat outranks a flat mega-repo", () => {
  const product = computeTrendingScore({
    stars: 0,
    pushedAt: null,
    socialScore: 90,
    firstSeenAt: daysAgo(1),
  });
  const flatGiant = computeTrendingScore({
    stars: 185_000,
    pushedAt: daysAgo(0),
    starGrowthPct7d: 0,
  });
  expect(product).toBeGreaterThan(flatGiant);
});

test("freshly discovered tool outranks an identical older one (freshness decays)", () => {
  const base = { stars: 1_500, pushedAt: daysAgo(3), starGrowthPct7d: null } as const;
  const justFound = computeTrendingScore({ ...base, firstSeenAt: daysAgo(1) });
  const monthOld = computeTrendingScore({ ...base, firstSeenAt: daysAgo(30) });
  expect(justFound).toBeGreaterThan(monthOld);
});

// --- eligibility (newcomer gate) -------------------------------------------

test("curated staples are excluded unless genuinely surging", () => {
  const flatStaple = computeTrendingEligible({
    kind: "repo",
    source: "curated",
    firstSeenAt: daysAgo(2), // recent re-seed must NOT make it eligible
    starGrowthPct7d: 1,
  });
  const surgingStaple = computeTrendingEligible({
    kind: "repo",
    source: "curated",
    firstSeenAt: daysAgo(900),
    starGrowthPct7d: SURGING_VELOCITY_PCT + 5,
  });
  expect(flatStaple).toBe(false);
  expect(surgingStaple).toBe(true);
});

test("discovered newcomers are eligible while young, and graduate out once old & cold", () => {
  const young = computeTrendingEligible({
    kind: "repo",
    source: "github",
    firstSeenAt: daysAgo(10),
    starGrowthPct7d: 0,
  });
  const oldAndCold = computeTrendingEligible({
    kind: "repo",
    source: "github",
    firstSeenAt: daysAgo(TRENDING_WINDOW_DAYS + 30),
    starGrowthPct7d: 0,
    lastSignalAt: null,
  });
  expect(young).toBe(true);
  expect(oldAndCold).toBe(false);
});

test("products are eligible while young or carrying a fresh social signal", () => {
  const youngProduct = computeTrendingEligible({
    kind: "product",
    source: "producthunt",
    firstSeenAt: daysAgo(5),
  });
  const oldButHotProduct = computeTrendingEligible({
    kind: "product",
    source: "reddit",
    firstSeenAt: daysAgo(TRENDING_WINDOW_DAYS + 60),
    lastSignalAt: daysAgo(2),
  });
  expect(youngProduct).toBe(true);
  expect(oldButHotProduct).toBe(true);
});
