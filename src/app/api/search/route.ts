import { NextRequest, NextResponse } from "next/server";
import { searchTools } from "@/lib/queries/tools";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await searchTools(q);
    return NextResponse.json({ items }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    console.error("[/api/search]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
