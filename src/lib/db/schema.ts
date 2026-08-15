import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  real,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const tools = pgTable(
  "tools",
  {
    id: text("id").primaryKey().notNull(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    githubOwner: text("github_owner"),
    githubRepo: text("github_repo"),
    githubUrl: text("github_url"),
    stars: integer("stars").notNull().default(0),
    forks: integer("forks").notNull().default(0),
    openIssues: integer("open_issues").notNull().default(0),
    githubTopics: text("github_topics").array().notNull().default([]),
    lastPushedAt: timestamp("last_pushed_at"),
    // When the GitHub repo itself was created — objective "newness" used by the
    // trending gate (immune to when our crawl first noticed it).
    githubCreatedAt: timestamp("github_created_at"),
    websiteUrl: text("website_url"),
    brewName: text("brew_name"),
    brewUrl: text("brew_url"),
    installsLast30d: integer("installs_last_30d").notNull().default(0),
    currentVersion: text("current_version"),
    featured: boolean("featured").notNull().default(false),
    trendingScore: real("trending_score").notNull().default(0),
    starGrowthPct7d: real("star_growth_pct_7d"),
    // Whether this entry is a code repo ("repo") or a non-GitHub product
    // launch ("product", e.g. a Show HN / Product Hunt debut with no public repo).
    kind: text("kind").notNull().default("repo"),
    // Where we first found it: "curated" (hand-seeded ecosystem), "github"
    // (topic/rising crawl), "hackernews", "producthunt", "reddit", "lobsters".
    source: text("source").notNull().default("curated"),
    // When discovery first saw this tool. Drives the "newcomer" trending window.
    // Set once on insert and never overwritten (unlike createdAt semantics, this
    // is explicit so curated re-seeds don't reset it).
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    // Recomputed every sync: is this tool a genuine newcomer / surging / freshly
    // hot on a social source? The Trending page filters on this so it stays
    // distinct from the full Explore catalog.
    trendingEligible: boolean("trending_eligible").notNull().default(false),
    // Normalized 0..100 cross-source social heat (PH votes / HN points / Reddit
    // upvotes), so products with no GitHub stars can still rank. Null when unseen.
    socialScore: real("social_score"),
    // Latest social source that surfaced this tool, and when. Drives the
    // fresh-signal trending gate and the source badge in the UI.
    socialSource: text("social_source"),
    lastSignalAt: timestamp("last_signal_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    dataFetchedAt: timestamp("data_fetched_at"),
  },
  (table) => [
    index("tools_stars_idx").on(table.stars),
    index("tools_trending_score_idx").on(table.trendingScore),
    index("tools_installs_last_30d_idx").on(table.installsLast30d),
    index("tools_created_at_idx").on(table.createdAt),
    index("tools_star_growth_pct_7d_idx").on(table.starGrowthPct7d),
    index("tools_trending_eligible_idx").on(table.trendingEligible),
  ]
);

export const toolMetricsHistory = pgTable(
  "tool_metrics_history",
  {
    id: text("id").primaryKey().notNull(),
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    capturedAt: timestamp("captured_at").notNull().defaultNow(),
    stars: integer("stars"),
    forks: integer("forks"),
    installsLast30d: integer("installs_last_30d"),
  },
  (table) => [
    index("tool_metrics_history_tool_id_captured_at_idx").on(
      table.toolId,
      table.capturedAt
    ),
  ]
);

export const categories = pgTable("categories", {
  id: text("id").primaryKey().notNull(),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  iconName: text("icon_name").notNull().default("Terminal"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const toolCategories = pgTable(
  "tool_categories",
  {
    toolId: text("tool_id")
      .notNull()
      .references(() => tools.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.toolId, table.categoryId] })]
);
