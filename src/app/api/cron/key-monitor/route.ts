import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { monitorKeyOrders } from "@/lib/esa/monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await monitorKeyOrders()) });
  } catch (err) {
    console.error("[key-monitor] failed", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "monitor failed" }, { status: 500 });
  }
}
