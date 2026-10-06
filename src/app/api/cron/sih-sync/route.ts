import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { syncCatalog } from "@/lib/sih/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await syncCatalog();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[sih-sync] failed", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "sync failed" }, { status: 500 });
  }
}
