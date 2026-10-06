import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { pollKeyOrders } from "@/lib/esa/poll";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await pollKeyOrders()) });
  } catch (err) {
    console.error("[key-poll] failed", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "poll failed" }, { status: 500 });
  }
}
