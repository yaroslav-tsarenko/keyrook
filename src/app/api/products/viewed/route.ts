import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loadSkinProducts } from "@/components/catalog/catalog-query";

const ID = /^[a-z0-9]{8,40}$/i;

export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => ID.test(id))
    .slice(0, 12);
  if (ids.length === 0) return NextResponse.json({ data: [] });
  const live = await prisma.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" }, select: { id: true } });
  const allowed = new Set(live.map((p) => p.id));
  const products = await loadSkinProducts(ids.filter((id) => allowed.has(id)));
  return NextResponse.json({ data: products }, { headers: { "Cache-Control": "private, max-age=60" } });
}
