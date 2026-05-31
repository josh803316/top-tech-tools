import { db } from "../db";
import { toolMetricsHistory, tools } from "../db/schema";
import { and, eq, lte, asc, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Pure helper: percent growth from `then` -> `now`.
 * Returns null when there is no usable baseline (then <= 0).
 */
export function growthPct(then: number, now: number): number | null {
  if (then <= 0) return null;
  return ((now - then) / then) * 100;
}

/** Insert a metrics snapshot row for a tool. */
export async function snapshotMetrics(
  toolId: string,
  m: { stars: number; forks: number; installsLast30d: number }
): Promise<void> {
  await db.insert(toolMetricsHistory).values({
    id: randomUUID(),
    toolId,
    stars: m.stars,
    forks: m.forks,
    installsLast30d: m.installsLast30d,
  });
}

/**
 * Compute trailing ~7-day star growth %.
 * Finds the snapshot closest to 7 days ago and compares against current stars.
 * Returns null when there is no prior snapshot (graceful, never throws).
 */
export async function computeStarGrowthPct7d(
  toolId: string,
  currentStars: number
): Promise<number | null> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thenStars = await pickClosestToSevenDaysAgo(toolId, sevenDaysAgo);
    if (thenStars === null) return null;
    return growthPct(thenStars, currentStars);
  } catch {
    return null;
  }
}

/**
 * Pick the snapshot stars value closest to ~7 days ago.
 * Strategy: prefer the latest snapshot at/before the cutoff; if none exists
 * (tool tracked for < 7 days), fall back to the earliest snapshot we have.
 */
async function pickClosestToSevenDaysAgo(
  toolId: string,
  cutoff: Date
): Promise<number | null> {
  const atOrBefore = await db
    .select({ stars: toolMetricsHistory.stars })
    .from(toolMetricsHistory)
    .where(
      and(
        eq(toolMetricsHistory.toolId, toolId),
        lte(toolMetricsHistory.capturedAt, cutoff)
      )
    )
    .orderBy(desc(toolMetricsHistory.capturedAt))
    .limit(1);

  if (atOrBefore.length > 0) return atOrBefore[0].stars ?? null;

  const earliest = await db
    .select({ stars: toolMetricsHistory.stars })
    .from(toolMetricsHistory)
    .where(eq(toolMetricsHistory.toolId, toolId))
    .orderBy(asc(toolMetricsHistory.capturedAt))
    .limit(1);

  if (earliest.length === 0) return null;
  return earliest[0].stars ?? null;
}

/**
 * Compute trailing 7-day star growth % and persist it to tools.starGrowthPct7d.
 * Returns the computed value (or null when no prior snapshot exists).
 */
export async function updateStarGrowth(
  toolId: string,
  currentStars: number
): Promise<number | null> {
  const pct = await computeStarGrowthPct7d(toolId, currentStars);
  await db
    .update(tools)
    .set({ starGrowthPct7d: pct })
    .where(eq(tools.id, toolId));
  return pct;
}
