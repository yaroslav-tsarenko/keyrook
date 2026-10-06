import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";
import { ANY_PRODUCT_FEED_ENABLED } from "@/config/catalog";

const FACET_PARAMS = ["minPrice", "maxPrice", "inStock", "onSale", "brand", "sort"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ANY_PRODUCT_FEED_ENABLED ? ["/", "/api/feeds/"] : ["/"],
        disallow: [
          "/admin",
          "/api/",
          "/account",
          "/cart",
          "/checkout",
          "/auth",
          "/order",
          "/search",
          "/catalog?category=",
          ...FACET_PARAMS.flatMap((param) => [`/*?${param}=`, `/*&${param}=`]),
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
