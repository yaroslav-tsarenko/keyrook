import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { reconcileSihOrders } from "@/lib/sih/reconcile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await reconcileSihOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[sih-reconcile] failed", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "reconcile failed" }, { status: 500 });
  }
}
