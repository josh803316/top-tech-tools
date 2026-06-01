import { describe, it, expect, mock, afterEach } from "bun:test";
import { discoverFromReddit, extractGithubUrl } from "./reddit";

const originalFetch = globalThis.fetch;

function listing(posts: unknown[]) {
  return { data: { children: posts.map((data) => ({ data })) } };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("extractGithubUrl", () => {
  it("normalizes a repo URL and strips extra path/.git", () => {
    expect(extractGithubUrl("https://github.com/acme/tool/tree/main")).toBe(
      "https://github.com/acme/tool"
    );
    expect(extractGithubUrl("https://github.com/acme/tool.git")).toBe(
      "https://github.com/acme/tool"
    );
  });
  it("returns null for non-github or malformed URLs", () => {
    expect(extractGithubUrl("https://example.com/x")).toBeNull();
    expect(extractGithubUrl("https://github.com/acme")).toBeNull();
    expect(extractGithubUrl(null)).toBeNull();
  });
});

describe("discoverFromReddit", () => {
  it("splits posts into github repo hits and product hits, dropping low-vote/self/aggregator posts", async () => {
    // Every subreddit fetch returns the same listing; that's fine for the shape test.
    globalThis.fetch = mock(async () => {
      return {
        ok: true,
        status: 200,
        json: async () =>
          listing([
            {
              title: "Show HN style: acme/fastcli a fast CLI tool",
              url: "https://github.com/acme/fastcli",
              ups: 1200,
              is_self: false,
              domain: "github.com",
              link_flair_text: null,
            },
            {
              title: "I built an AI agent dev tool you can self-host",
              url: "https://coolproduct.dev/launch",
              ups: 800,
              is_self: false,
              domain: "coolproduct.dev",
              link_flair_text: "Project",
            },
            {
              title: "low effort post",
              url: "https://example.com/whatever",
              ups: 5, // below minUps
              is_self: false,
              domain: "example.com",
              link_flair_text: null,
            },
            {
              title: "a youtube video about tools",
              url: "https://youtube.com/watch?v=x",
              ups: 999,
              is_self: false,
              domain: "youtube.com", // skipped aggregator domain
              link_flair_text: null,
            },
          ]),
      } as unknown as Response;
    }) as unknown as typeof fetch;

    const { repos, products } = await discoverFromReddit({ minUps: 200 });

    expect(repos.some((r) => r.owner === "acme" && r.repo === "fastcli")).toBe(true);
    expect(repos.every((r) => r.source === "reddit")).toBe(true);

    expect(products.some((p) => p.url === "https://coolproduct.dev/launch")).toBe(true);
    expect(products.every((p) => p.source === "reddit")).toBe(true);

    // youtube + low-vote posts must not appear anywhere
    const allUrls = [...products.map((p) => p.url)];
    expect(allUrls.some((u) => u.includes("youtube"))).toBe(false);
    expect(allUrls.some((u) => u.includes("example.com"))).toBe(false);
  });

  it("returns empty arrays on a non-OK response", async () => {
    globalThis.fetch = mock(async () => {
      return { ok: false, status: 429, json: async () => ({}) } as unknown as Response;
    }) as unknown as typeof fetch;
    const { repos, products } = await discoverFromReddit({ minUps: 200 });
    expect(repos).toEqual([]);
    expect(products).toEqual([]);
  });
});
