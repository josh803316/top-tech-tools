import { NextRequest, NextResponse } from "next/server";
import { getTools } from "@/lib/queries/tools";
import type { SortOption } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sort = (searchParams.get("sort") ?? "stars") as SortOption;
  const category = searchParams.get("category") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const cursor = searchParams.get("cursor") ?? undefined;

  try {
    const result = await getTools({ sort, category, q, cursor });
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.error("[/api/tools]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
