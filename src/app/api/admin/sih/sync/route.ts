import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { hasEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { syncCatalog } from "@/lib/sih/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MIN_GAP_MS = 5 * 60 * 1000;

export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  if (!hasEnv("SIH_API_KEY")) return NextResponse.json({ ok: false, error: "SIH_API_KEY is not set" }, { status: 503 });

  const running = await prisma.catalogSyncRun.findFirst({
    where: { status: "running", startedAt: { gt: new Date(Date.now() - MIN_GAP_MS) } },
    select: { id: true },
  });
  if (running) return NextResponse.json({ ok: false, error: "A sync is already running" }, { status: 409 });

  try {
    const result = await syncCatalog({ label: "admin" });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[admin-sync] failed", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "sync failed" }, { status: 500 });
  }
}
