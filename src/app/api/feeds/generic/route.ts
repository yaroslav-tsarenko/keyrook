import type { NextRequest } from "next/server";
import { PRODUCT_FEEDS } from "@/config/catalog";
import { feedContext, feedHeaders, loadFeedItems } from "@/lib/feeds/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!PRODUCT_FEEDS.generic.enabled) return Response.json({ code: "FEED_DISABLED" }, { status: 404 });
  try {
    const [ctx, items] = await Promise.all([feedContext(request.nextUrl.searchParams.get("currency")), loadFeedItems()]);
    const products = items.map((item) => ({
      id: item.id,
      itemGroupId: item.itemGroupId,
      name: item.title,
      sku: item.id,
      description: item.description,
      price: ctx.convert(item.salePrice ?? item.price),
      comparePrice: item.salePrice != null ? ctx.convert(item.price) : null,
      currency: ctx.currency,
      availability: item.availability,
      quantity: item.quantity,
      condition: item.condition,
      brand: item.brand,
      gtin: item.gtin,
      mpn: item.mpn,
      googleProductCategory: item.googleCategoryId,
      productType: item.productType,
      categories: item.categoryNames,
      images: [item.imageLink, ...item.additionalImageLinks],
      url: item.link,
      weightKg: item.weightKg,
      updatedAt: item.updatedAt,
    }));
    return new Response(JSON.stringify({ products, count: products.length, currency: ctx.currency, generatedAt: new Date().toISOString() }), {
      headers: feedHeaders("application/json; charset=utf-8"),
    });
  } catch (error) {
    console.error("Error generating generic feed:", error);
    return Response.json({ error: "Failed to generate feed" }, { status: 503, headers: { "Retry-After": "300" } });
  }
}
