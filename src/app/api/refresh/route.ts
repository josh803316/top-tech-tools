import { NextRequest, NextResponse } from "next/server";
import { syncAllTools } from "@/lib/fetchers/sync";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllTools();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/refresh]", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

// Vercel cron calls GET
export async function GET(req: NextRequest) {
  return POST(req);
}
