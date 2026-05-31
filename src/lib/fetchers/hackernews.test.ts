import { describe, it, expect, mock, afterEach } from "bun:test";
import { discoverFromHackerNews, extractGithubUrl } from "./hackernews";
import { githubCandidatesFromUrls } from "./discover";

const originalFetch = globalThis.fetch;

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  globalThis.fetch = mock(async () => {
    return {
      ok,
      status,
      json: async () => body,
    } as unknown as Response;
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("discoverFromHackerNews", () => {
  it("parses a sample Algolia response into HNCandidate[]", async () => {
    mockFetchOnce({
      hits: [
        {
          title: "Show HN: a blazing fast CLI tool",
          url: "https://github.com/acme/fastcli",
          points: 320,
          num_comments: 88,
        },
        {
          title: "My thoughts on cooking pasta", // filtered: not dev-tool-ish
          url: "https://example.com/pasta",
          points: 500,
          num_comments: 10,
        },
        {
          title: "Ripgrep is a great terminal search tool",
          url: "https://example.com/ripgrep-review",
          points: 210,
          num_comments: 40,
        },
      ],
    });

    const result = await discoverFromHackerNews({ minPoints: 100 });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      title: "Show HN: a blazing fast CLI tool",
      url: "https://github.com/acme/fastcli",
      githubUrl: "https://github.com/acme/fastcli",
      points: 320,
      numComments: 88,
    });
    // dev-tool-ish but no github link
    expect(result[1].githubUrl).toBeNull();
    expect(result[1].url).toBe("https://example.com/ripgrep-review");
  });

  it("returns [] on a fetch error", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("network down");
    });
    const result = await discoverFromHackerNews();
    expect(result).toEqual([]);
  });

  it("returns [] on a non-ok response", async () => {
    mockFetchOnce({}, false, 503);
    const result = await discoverFromHackerNews();
    expect(result).toEqual([]);
  });
});

describe("extractGithubUrl", () => {
  it("extracts owner/repo from a github story URL", () => {
    expect(extractGithubUrl("https://github.com/sharkdp/bat")).toBe(
      "https://github.com/sharkdp/bat"
    );
    // tolerates extra path segments + trailing slash
    expect(extractGithubUrl("https://github.com/sharkdp/bat/tree/main/")).toBe(
      "https://github.com/sharkdp/bat"
    );
  });

  it("returns null for non-github or malformed URLs", () => {
    expect(extractGithubUrl("https://example.com/foo")).toBeNull();
    expect(extractGithubUrl("https://github.com/onlyowner")).toBeNull();
    expect(extractGithubUrl(null)).toBeNull();
    expect(extractGithubUrl("not a url")).toBeNull();
  });
});

describe("githubCandidatesFromUrls", () => {
  it("parses owner/repo, handles trailing slashes, skips non-github, dedupes", () => {
    const result = githubCandidatesFromUrls([
      "https://github.com/acme/fastcli",
      "https://github.com/acme/fastcli/", // dup with trailing slash
      "https://github.com/sharkdp/bat/tree/main",
      "https://www.github.com/foo/bar.git",
      "https://example.com/not-github",
      "https://github.com/owneronly", // too few segments
      "garbage",
    ]);

    expect(result).toEqual([
      { owner: "acme", repo: "fastcli" },
      { owner: "sharkdp", repo: "bat" },
      { owner: "foo", repo: "bar" },
    ]);
  });
});
