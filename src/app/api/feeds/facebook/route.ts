import type { NextRequest } from "next/server";
import { PRODUCT_FEEDS } from "@/config/catalog";
import { feedContext, feedHeaders, loadFeedItems } from "@/lib/feeds/catalog";
import { metaFeedCsv } from "@/lib/feeds/format";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!PRODUCT_FEEDS.facebook.enabled) return Response.json({ code: "FEED_DISABLED" }, { status: 404 });
  try {
    const [ctx, items] = await Promise.all([feedContext(request.nextUrl.searchParams.get("currency")), loadFeedItems()]);
    return new Response(metaFeedCsv(items, ctx), { headers: feedHeaders("text/csv; charset=utf-8", undefined, `meta-catalogue-${ctx.currency.toLowerCase()}.csv`) });
  } catch (error) {
    console.error("Error generating Meta feed:", error);
    return Response.json({ error: "Failed to generate feed" }, { status: 503, headers: { "Retry-After": "300" } });
  }
}
