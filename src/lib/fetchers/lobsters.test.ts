import { afterEach, describe, expect, it, mock } from "bun:test";
import { discoverFromLobsters, lobstersScoreToSocialScore } from "./lobsters";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("discoverFromLobsters", () => {
  it("keeps qualifying GitHub repositories and deduplicates them", async () => {
    globalThis.fetch = mock(async () =>
      Response.json([
        {
          title: "A fast new terminal",
          url: "https://github.com/acme/warp-speed",
          score: 24,
          comment_count: 8,
          tags: ["release", "rust"],
        },
        {
          title: "Duplicate discussion",
          url: "https://github.com/acme/warp-speed/tree/main",
          score: 20,
          comment_count: 2,
          tags: ["rust"],
        },
        {
          title: "Not a repository",
          url: "https://example.com/post",
          score: 90,
          comment_count: 30,
          tags: ["programming"],
        },
        {
          title: "Below the quality floor",
          url: "https://github.com/acme/tiny",
          score: 4,
          comment_count: 0,
          tags: ["release"],
        },
      ])
    ) as unknown as typeof fetch;

    await expect(discoverFromLobsters({ minScore: 10 })).resolves.toEqual([
      {
        owner: "acme",
        repo: "warp-speed",
        source: "lobsters",
        socialScore: lobstersScoreToSocialScore(24),
      },
    ]);
  });

  it("fails gracefully when Lobsters is unavailable", async () => {
    globalThis.fetch = mock(async () => new Response(null, { status: 503 })) as unknown as typeof fetch;
    await expect(discoverFromLobsters()).resolves.toEqual([]);
  });
});

describe("lobstersScoreToSocialScore", () => {
  it("normalizes scores into the shared 0..100 range", () => {
    expect(lobstersScoreToSocialScore(-1)).toBe(0);
    expect(lobstersScoreToSocialScore(25)).toBe(50);
    expect(lobstersScoreToSocialScore(100)).toBe(100);
  });
});
