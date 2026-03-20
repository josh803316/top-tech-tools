export type Category = {
  id: string;
  slug: string;
  label: string;
  iconName: string;
  sortOrder: number;
};

export type Tool = {
  id: string;
  slug: string;
  name: string;
  description: string;
  githubOwner: string | null;
  githubRepo: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  githubTopics: string[];
  lastPushedAt: string | null;
  brewName: string | null;
  brewUrl: string | null;
  installsLast30d: number;
  currentVersion: string | null;
  featured: boolean;
  trendingScore: number;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
  dataFetchedAt: string | null;
};

export type SortOption = "stars" | "trending" | "newest" | "installs";

export type CuratedTool = {
  slug: string;
  name: string;
  description: string;
  githubOwner?: string;
  githubRepo?: string;
  websiteUrl?: string;
  brewName?: string;
  categories: string[];
  featured?: boolean;
};
