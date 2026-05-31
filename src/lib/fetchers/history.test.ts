import { describe, expect, test } from "bun:test";

// Importing ./history transitively loads ../db, which calls neon() at module
// load time. Provide a dummy connection string so the import succeeds; no DB
// call is made by the pure growthPct helper under test.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";

const { growthPct } = await import("./history");

describe("growthPct", () => {
  test("100 -> 150 is +50%", () => {
    expect(growthPct(100, 150)).toBe(50);
  });

  test("no prior baseline (0) returns null", () => {
    expect(growthPct(0, 150)).toBeNull();
  });

  test("negative/invalid baseline returns null", () => {
    expect(growthPct(-10, 5)).toBeNull();
  });

  test("flat (no change) is 0%", () => {
    expect(growthPct(100, 100)).toBe(0);
  });

  test("decline is negative", () => {
    expect(growthPct(200, 100)).toBe(-50);
  });
});
