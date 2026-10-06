import { NextResponse } from "next/server";
import { getStoreIndex } from "@/lib/catalog/store-index";

export const revalidate = 300;

export async function GET() {
  try {
    const index = await getStoreIndex();
    return NextResponse.json(index, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
        "CDN-Cache-Control": "public, s-maxage=600",
      },
    });
  } catch {
    return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
