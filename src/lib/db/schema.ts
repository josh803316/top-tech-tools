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
    websiteUrl: text("website_url"),
    brewName: text("brew_name"),
    brewUrl: text("brew_url"),
    installsLast30d: integer("installs_last_30d").notNull().default(0),
    currentVersion: text("current_version"),
    featured: boolean("featured").notNull().default(false),
    trendingScore: real("trending_score").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    dataFetchedAt: timestamp("data_fetched_at"),
  },
  (table) => [
    index("tools_stars_idx").on(table.stars),
    index("tools_trending_score_idx").on(table.trendingScore),
    index("tools_installs_last_30d_idx").on(table.installsLast30d),
    index("tools_created_at_idx").on(table.createdAt),
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
