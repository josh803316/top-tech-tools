import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_TOKEN = process.env.PRODUCT_HUNT_TOKEN;

async function loadFetcher() {
  // Re-import fresh so the module-level token snapshot reflects current env.
  const mod = await import(`./producthunt.ts?t=${Date.now()}`);
  return mod.fetchTrendingProductHunt as typeof import("./producthunt").fetchTrendingProductHunt;
}

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  if (ORIGINAL_TOKEN === undefined) {
    delete process.env.PRODUCT_HUNT_TOKEN;
  } else {
    process.env.PRODUCT_HUNT_TOKEN = ORIGINAL_TOKEN;
  }
});

describe("fetchTrendingProductHunt", () => {
  it("returns [] when token is missing", async () => {
    delete process.env.PRODUCT_HUNT_TOKEN;
    const fetchMock = mock(() => Promise.reject(new Error("should not be called")));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const fetchTrendingProductHunt = await loadFetcher();
    const result = await fetchTrendingProductHunt();

    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("parses a sample GraphQL response with correct rank ordering and githubUrl extraction", async () => {
    process.env.PRODUCT_HUNT_TOKEN = "test-token";

    const sample = {
      data: {
        posts: {
          edges: [
            {
              node: {
                name: "Alpha",
                tagline: "First tool",
                url: "https://www.producthunt.com/posts/alpha",
                website: "https://github.com/acme/alpha",
                votesCount: 500,
                topics: { edges: [{ node: { name: "Developer Tools" } }, { node: { name: "Open Source" } }] },
              },
            },
            {
              node: {
                name: "Beta",
                tagline: "Second tool",
                url: "https://www.producthunt.com/posts/beta",
                website: "https://beta.example.com",
                votesCount: 250,
                topics: { edges: [{ node: { name: "Productivity" } }] },
              },
            },
          ],
        },
      },
    };

    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify(sample), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    ) as unknown as typeof fetch;

    const fetchTrendingProductHunt = await loadFetcher();
    const result = await fetchTrendingProductHunt({ first: 2 });

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      name: "Alpha",
      tagline: "First tool",
      url: "https://www.producthunt.com/posts/alpha",
      githubUrl: "https://github.com/acme/alpha",
      votesCount: 500,
      rank: 1,
      topics: ["Developer Tools", "Open Source"],
    });

    expect(result[1]?.rank).toBe(2);
    expect(result[1]?.name).toBe("Beta");
    expect(result[1]?.githubUrl).toBeNull();
    expect(result[1]?.topics).toEqual(["Productivity"]);
  });

  it("returns [] on fetch error", async () => {
    process.env.PRODUCT_HUNT_TOKEN = "test-token";
    globalThis.fetch = mock(() =>
      Promise.reject(new Error("network down"))
    ) as unknown as typeof fetch;

    const fetchTrendingProductHunt = await loadFetcher();
    const result = await fetchTrendingProductHunt();

    expect(result).toEqual([]);
  });
});
