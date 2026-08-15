export type PHProduct = {
  name: string;
  tagline: string;
  url: string;
  githubUrl: string | null;
  votesCount: number;
  rank: number;
  topics: string[];
};

const PH_ENDPOINT = "https://api.producthunt.com/v2/api/graphql";

type PHPostNode = {
  name: string;
  tagline: string;
  url: string;
  website: string | null;
  votesCount: number;
  topics: { edges: Array<{ node: { name: string } }> };
};

type PHResponse = {
  data?: {
    posts?: {
      edges: Array<{ node: PHPostNode }>;
    };
  };
};

function extractGithubUrl(node: PHPostNode): string | null {
  const candidates = [node.website, node.url];
  for (const candidate of candidates) {
    if (candidate && candidate.includes("github.com")) return candidate;
  }
  return null;
}

export async function fetchTrendingProductHunt(
  opts?: { first?: number }
): Promise<PHProduct[]> {
  const productHuntToken = process.env.PRODUCT_HUNT_TOKEN;
  if (!productHuntToken) {
    console.warn("PRODUCT_HUNT_TOKEN is unset; skipping Product Hunt fetch");
    return [];
  }

  const first = opts?.first ?? 20;
  const query = `query TrendingPosts($first: Int!) {
    posts(order: VOTES, first: $first) {
      edges {
        node {
          name
          tagline
          url
          website
          votesCount
          topics(first: 10) {
            edges { node { name } }
          }
        }
      }
    }
  }`;

  try {
    const res = await fetch(PH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${productHuntToken}`,
      },
      body: JSON.stringify({ query, variables: { first } }),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn(`Product Hunt request failed with status ${res.status}`);
      return [];
    }

    const json: PHResponse = await res.json();
    const edges = json.data?.posts?.edges;
    if (!edges) {
      console.warn("Product Hunt response missing posts data");
      return [];
    }

    return edges.map(({ node }, index) => ({
      name: node.name,
      tagline: node.tagline,
      url: node.url,
      githubUrl: extractGithubUrl(node),
      votesCount: node.votesCount,
      rank: index + 1,
      topics: node.topics.edges.map((e) => e.node.name),
    }));
  } catch (err) {
    console.warn("Product Hunt fetch error:", err);
    return [];
  }
}
