import { type RepoHit } from "./social";

const LOBSTERS_HOTTEST_URL = "https://lobste.rs/hottest.json";
const USER_AGENT =
  "top-tech-tools/1.0 (+https://top-tech-tools.vercel.app) discovery bot";

type LobstersStory = {
  url: string | null;
  score: number | null;
};

export function lobstersScoreToSocialScore(score: number): number {
  if (!Number.isFinite(score) || score <= 0) return 0;
  return Math.min(100, score * 2);
}

function githubRepo(url: string | null): { owner: string; repo: string } | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") return null;
    const [owner, rawRepo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !rawRepo) return null;
    return { owner, repo: rawRepo.replace(/\.git$/, "") };
  } catch {
    return null;
  }
}

/** Pull high-confidence repositories from Lobsters' focused programming feed. */
export async function discoverFromLobsters(
  opts?: { minScore?: number }
): Promise<RepoHit[]> {
  const minScore = opts?.minScore ?? 10;
  try {
    const res = await fetch(LOBSTERS_HOTTEST_URL, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.warn(`[lobsters] hottest feed error: ${res.status}`);
      return [];
    }

    const stories = (await res.json()) as LobstersStory[];
    const seen = new Set<string>();
    const hits: RepoHit[] = [];
    for (const story of stories) {
      const score = story.score ?? 0;
      if (score < minScore) continue;
      const repo = githubRepo(story.url);
      if (!repo) continue;
      const key = `${repo.owner}/${repo.repo}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({ ...repo, source: "lobsters", socialScore: lobstersScoreToSocialScore(score) });
    }
    return hits;
  } catch {
    return [];
  }
}
