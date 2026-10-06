import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { hasEnv } from "@/lib/env";
import { refreshCatalog } from "@/lib/esa/refresh";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST() {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  if (!hasEnv("KINGUIN_API_KEY")) return NextResponse.json({ ok: false, error: "Supplier API key is not set" }, { status: 503 });
  try {
    const result = await refreshCatalog();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[admin-refresh] failed", err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "refresh failed" }, { status: 500 });
  }
}
