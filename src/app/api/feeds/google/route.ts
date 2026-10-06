import type { NextRequest } from "next/server";
import { PRODUCT_FEEDS } from "@/config/catalog";
import { feedContext, feedHeaders, loadFeedItems, shippingCountries } from "@/lib/feeds/catalog";
import { googleFeedXml } from "@/lib/feeds/format";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!PRODUCT_FEEDS.google.enabled) return Response.json({ code: "FEED_DISABLED" }, { status: 404 });
  try {
    const params = request.nextUrl.searchParams;
    const [ctx, items] = await Promise.all([feedContext(params.get("currency")), loadFeedItems()]);
    const xml = googleFeedXml(items, ctx, { countries: shippingCountries(params.get("country"), ctx.currency) });
    return new Response(xml, { headers: feedHeaders("application/xml; charset=utf-8") });
  } catch (error) {
    console.error("Error generating Google feed:", error);
    return Response.json({ error: "Failed to generate feed" }, { status: 503, headers: { "Retry-After": "300" } });
  }
}
