import { db } from "@/lib/db";
import { tools, categories, toolCategories } from "@/lib/db/schema";
import { eq, desc, asc, ilike, or, inArray, sql } from "drizzle-orm";
import type { SortOption, Tool, Category } from "@/lib/types";

type RawTool = typeof tools.$inferSelect;
type RawCategory = typeof categories.$inferSelect;

function formatTool(tool: RawTool, cats: RawCategory[]): Tool {
  return {
    ...tool,
    websiteUrl: tool.websiteUrl ?? null,
    lastPushedAt: tool.lastPushedAt?.toISOString() ?? null,
    createdAt: tool.createdAt.toISOString(),
    updatedAt: tool.updatedAt.toISOString(),
    dataFetchedAt: tool.dataFetchedAt?.toISOString() ?? null,
    categories: cats.map((c) => ({
      id: c.id,
      slug: c.slug,
      label: c.label,
      iconName: c.iconName,
      sortOrder: c.sortOrder,
    })),
  };
}

const ORDER_BY: Record<SortOption, Parameters<typeof desc>[0]> = {
  stars: tools.stars,
  trending: tools.trendingScore,
  newest: tools.createdAt,
  installs: tools.installsLast30d,
};

export async function getTools({
  sort = "stars",
  category,
  q,
  cursor,
  limit = 24,
}: {
  sort?: SortOption;
  category?: string;
  q?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ items: Tool[]; nextCursor: string | null }> {
  // Get tool IDs filtered by category
  let filteredIds: string[] | null = null;
  if (category) {
    const catRecord = await db.query.categories.findFirst({
      where: eq(categories.slug, category),
    });
    if (catRecord) {
      const joins = await db.query.toolCategories.findMany({
        where: eq(toolCategories.categoryId, catRecord.id),
      });
      filteredIds = joins.map((j) => j.toolId);
    } else {
      return { items: [], nextCursor: null };
    }
  }

  // Build query
  const orderCol = ORDER_BY[sort];
  const conditions = [];

  if (q) {
    conditions.push(
      or(ilike(tools.name, `%${q}%`), ilike(tools.description, `%${q}%`))
    );
  }

  if (filteredIds !== null) {
    if (filteredIds.length === 0) return { items: [], nextCursor: null };
    conditions.push(inArray(tools.id, filteredIds));
  }

  if (cursor) {
    // cursor is the last item's sort value encoded as "value:id"
    const [, id] = cursor.split(":");
    conditions.push(sql`${tools.id} != ${id}`);
  }

  const where = conditions.length > 0 ? conditions.reduce((a, b) => sql`${a} AND ${b}`) : undefined;

  const rows = await db.query.tools.findMany({
    where,
    orderBy: [desc(orderCol), asc(tools.id)],
    limit: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  // Fetch categories for each tool
  const toolIds = items.map((t) => t.id);
  const catJoins =
    toolIds.length > 0
      ? await db.query.toolCategories.findMany({
          where: inArray(toolCategories.toolId, toolIds),
        })
      : [];

  const allCatIds = [...new Set(catJoins.map((j) => j.categoryId))];
  const allCats =
    allCatIds.length > 0
      ? await db.query.categories.findMany({
          where: inArray(categories.id, allCatIds),
        })
      : [];
  const catMap = new Map(allCats.map((c) => [c.id, c]));

  const toolCatMap = new Map<string, RawCategory[]>();
  for (const j of catJoins) {
    const cat = catMap.get(j.categoryId);
    if (cat) {
      if (!toolCatMap.has(j.toolId)) toolCatMap.set(j.toolId, []);
      toolCatMap.get(j.toolId)!.push(cat);
    }
  }

  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? `${(lastItem as Record<string, unknown>)[sort]}:${lastItem.id}` : null;

  return {
    items: items.map((t) => formatTool(t, toolCatMap.get(t.id) ?? [])),
    nextCursor,
  };
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const tool = await db.query.tools.findFirst({ where: eq(tools.slug, slug) });
  if (!tool) return null;

  const catJoins = await db.query.toolCategories.findMany({
    where: eq(toolCategories.toolId, tool.id),
  });
  const catIds = catJoins.map((j) => j.categoryId);
  const cats =
    catIds.length > 0
      ? await db.query.categories.findMany({ where: inArray(categories.id, catIds) })
      : [];

  return formatTool(tool, cats);
}

export async function searchTools(q: string): Promise<Tool[]> {
  const rows = await db.query.tools.findMany({
    where: or(ilike(tools.name, `%${q}%`), ilike(tools.description, `%${q}%`)),
    orderBy: [desc(tools.stars)],
    limit: 20,
  });

  if (rows.length === 0) return [];

  const toolIds = rows.map((t) => t.id);
  const catJoins = await db.query.toolCategories.findMany({
    where: inArray(toolCategories.toolId, toolIds),
  });
  const allCatIds = [...new Set(catJoins.map((j) => j.categoryId))];
  const allCats =
    allCatIds.length > 0
      ? await db.query.categories.findMany({ where: inArray(categories.id, allCatIds) })
      : [];
  const catMap = new Map(allCats.map((c) => [c.id, c]));

  const toolCatMap = new Map<string, RawCategory[]>();
  for (const j of catJoins) {
    const cat = catMap.get(j.categoryId);
    if (cat) {
      if (!toolCatMap.has(j.toolId)) toolCatMap.set(j.toolId, []);
      toolCatMap.get(j.toolId)!.push(cat);
    }
  }

  return rows.map((t) => formatTool(t, toolCatMap.get(t.id) ?? []));
}

export async function getAllCategories() {
  return db.query.categories.findMany({
    orderBy: [asc(categories.sortOrder)],
  });
}

export async function getTopToolsByCategory(
  topN = 3
): Promise<Array<{ category: Category; tools: Tool[] }>> {
  const cats = await getAllCategories();
  const results = await Promise.all(
    cats.map(async (cat) => {
      const { items } = await getTools({ category: cat.slug, sort: "stars", limit: topN });
      return {
        category: {
          id: cat.id,
          slug: cat.slug,
          label: cat.label,
          iconName: cat.iconName,
          sortOrder: cat.sortOrder,
        },
        tools: items,
      };
    })
  );
  return results.filter((r) => r.tools.length > 0);
}
