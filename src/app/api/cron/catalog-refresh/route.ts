import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { refreshCatalog } from "@/lib/esa/refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await refreshCatalog()) });
  } catch (err) {
    console.error("[catalog-refresh] failed", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "refresh failed" }, { status: 500 });
  }
}
