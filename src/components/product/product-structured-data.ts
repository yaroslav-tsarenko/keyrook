import { STORE_POLICY } from "@/config/store-policy";
import { COMPANY } from "@/lib/company";
import { BRAND, SITE_URL } from "@/lib/brand";

export const EU_COUNTRY_CODES = ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"];

export function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function validGtin13(...candidates: (string | null | undefined)[]): string | null {
  for (const raw of candidates) {
    const code = raw?.replace(/\s+/g, "") ?? "";
    if (!/^\d{13}$/.test(code)) continue;
    const digits = code.split("").map(Number);
    const sum = digits.slice(0, 12).reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
    if ((10 - (sum % 10)) % 10 === digits[12]) return code;
  }
  return null;
}

export function dayRange(text: string): { min: number; max: number } | null {
  const m = text.match(/(\d+)\s*[–—-]\s*(\d+)/);
  if (m) return { min: Number(m[1]), max: Number(m[2]) };
  const single = text.match(/(\d+)/);
  return single ? { min: Number(single[1]), max: Number(single[1]) } : null;
}

const CONDITION: Record<string, string> = {
  new: "https://schema.org/NewCondition",
  refurbished: "https://schema.org/RefurbishedCondition",
  used: "https://schema.org/UsedCondition",
};

export function merchantReturnPolicy() {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: ["GB", ...EU_COUNTRY_CODES],
    returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
    merchantReturnLink: absoluteUrl("/policies/returns"),
  };
}

export interface ProductLdInput {
  name: string;
  slug: string;
  sku: string;
  description: string;
  images: string[];
  brand: string | null;
  ean: string | null;
  gtin: string | null;
  price: number;
  available: boolean;
  condition: string;
  category: string | null;
  reviews: { rating: number; comment: string | null; author: string | null; createdAt: Date }[];
}

export function productJsonLd(input: ProductLdInput): Record<string, unknown> {
  const url = absoluteUrl(`/product/${input.slug}`);
  const gtin13 = validGtin13(input.ean, input.gtin);
  const reviewCount = input.reviews.length;
  const average = reviewCount ? input.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: input.name,
    url,
    ...(input.images.length ? { image: input.images.map(absoluteUrl) } : {}),
    ...(input.description ? { description: input.description } : {}),
    sku: input.sku,
    ...(gtin13 ? { gtin13 } : {}),
    ...(input.brand ? { brand: { "@type": "Brand", name: input.brand } } : {}),
    ...(input.category ? { category: input.category } : {}),
    offers: {
      "@type": "Offer",
      url,
      price: input.price.toFixed(2),
      priceCurrency: STORE_POLICY.currency,
      availability: input.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: CONDITION[input.condition.toLowerCase()] ?? CONDITION.new,
      seller: { "@type": "Organization", name: COMPANY.name, alternateName: BRAND.name },
      hasMerchantReturnPolicy: merchantReturnPolicy(),
    },
    ...(reviewCount
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: average.toFixed(1), reviewCount, bestRating: 5, worstRating: 1 },
          review: input.reviews.slice(0, 10).map((r) => ({
            "@type": "Review",
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
            author: { "@type": "Person", name: r.author || "Customer" },
            datePublished: r.createdAt.toISOString().slice(0, 10),
            ...(r.comment ? { reviewBody: r.comment } : {}),
          })),
        }
      : {}),
  };
}
