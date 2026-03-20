export type GitHubRepoData = {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  pushed_at: string;
};

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function fetchGitHubRepo(
  owner: string,
  repo: string
): Promise<GitHubRepoData | null> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers,
      next: { revalidate: 3600 },
    });

    if (res.status === 404) return null;

    const remaining = res.headers.get("X-RateLimit-Remaining");
    if (res.status === 403 || res.status === 429 || (remaining && parseInt(remaining) === 0)) {
      console.warn(`GitHub rate limit hit for ${owner}/${repo}`);
      return null;
    }

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function computeTrendingScore(stars: number, pushedAt: string | null): number {
  if (!pushedAt) return stars / Math.pow(2 + 2, 1.5);
  const daysSincePush = (Date.now() - new Date(pushedAt).getTime()) / (1000 * 60 * 60 * 24);
  return stars / Math.pow(daysSincePush + 2, 1.5);
}
