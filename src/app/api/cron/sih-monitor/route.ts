import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { monitorSih } from "@/lib/sih/monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await monitorSih();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[sih-monitor] failed", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "monitor failed" }, { status: 500 });
  }
}
