import { prisma } from "@/lib/prisma";
import { STORE_POLICY } from "@/config/store-policy";
import { googleTaxonomyFor } from "@/config/google-taxonomy";
import { getRate, isSupportedCurrency, type SupportedCurrency } from "@/lib/exchange-rates";
import { rateConverter, type Convert } from "@/lib/pricing";
import { htmlToText, clampText } from "@/lib/utils/sanitize-html";
import { hasSupplierSku, publicBrand, scrubSupplierText, stripSupplierMentions } from "@/lib/utils/supplier";
import { getCategoryTree } from "@/components/catalog/catalog-query";
import { EU_COUNTRY_CODES } from "@/components/product/product-structured-data";
import { validGtin } from "@/lib/seo/gtin";
import { absoluteUrl, publicImageUrls } from "@/lib/seo/url";

export const FEED_TITLE_MAX = 150;
export const FEED_DESCRIPTION_MAX = 5000;
export const FEED_ADDITIONAL_IMAGES = 10;
export const FEED_CACHE_SECONDS = 3600;

export type Availability = "in_stock" | "out_of_stock";

export interface FeedItem {
  id: string;
  itemGroupId: string | null;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: Availability;
  quantity: number | null;
  price: number;
  salePrice: number | null;
  brand: string | null;
  gtin: string | null;
  mpn: string | null;
  condition: "new" | "refurbished" | "used";
  googleCategoryId: number;
  googleCategoryName: string;
  productType: string | null;
  categoryNames: string[];
  weightKg: number | null;
  color: string | null;
  size: string | null;
  material: string | null;
  updatedAt: Date;
}

export interface FeedContext {
  currency: SupportedCurrency;
  convert: Convert;
}

export async function feedContext(requested: string | null): Promise<FeedContext> {
  const upper = requested?.toUpperCase() ?? null;
  const currency: SupportedCurrency = isSupportedCurrency(upper) ? upper : STORE_POLICY.currency;
  const rate = currency === STORE_POLICY.currency ? 1 : await getRate(currency);
  return { currency, convert: rateConverter(rate) };
}

export function feedMoney(amountInBase: number, ctx: FeedContext): string {
  return `${ctx.convert(amountInBase).toFixed(2)} ${ctx.currency}`;
}

function cleanTitle(name: string): string {
  const text = stripSupplierMentions(name).replace(/\s+/g, " ").trim();
  if (text.length <= FEED_TITLE_MAX) return text;
  const cut = text.slice(0, FEED_TITLE_MAX + 1);
  const space = cut.lastIndexOf(" ");
  return (space > FEED_TITLE_MAX * 0.6 ? cut.slice(0, space) : text.slice(0, FEED_TITLE_MAX)).replace(/[\s,.;:–—-]+$/, "");
}

function cleanDescription(html: string | null, fallback: string | null, title: string): string {
  const raw = htmlToText(html) || htmlToText(fallback) || title;
  const scrubbed = scrubSupplierText(raw).replace(/\s+/g, " ").trim() || title;
  return clampText(scrubbed, FEED_DESCRIPTION_MAX);
}

const CONDITIONS = new Set(["new", "refurbished", "used"]);

function optionValue(options: unknown, keys: string[]): string | null {
  if (!options || typeof options !== "object" || Array.isArray(options)) return null;
  for (const [key, value] of Object.entries(options as Record<string, unknown>)) {
    if (keys.includes(key.toLowerCase()) && (typeof value === "string" || typeof value === "number")) return String(value).slice(0, 100);
  }
  return null;
}

function characteristic(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  for (const [group, entries] of Object.entries(value as Record<string, unknown>)) {
    if (entries && typeof entries === "object" && !Array.isArray(entries)) {
      const found = optionValue(entries, keys);
      if (found) return found;
    } else if (keys.includes(group.toLowerCase()) && (typeof entries === "string" || typeof entries === "number")) {
      return String(entries).slice(0, 200);
    }
  }
  return null;
}

export async function loadFeedItems(): Promise<FeedItem[]> {
  const [tree, products] = await Promise.all([
    getCategoryTree(),
    prisma.product.findMany({
      where: { status: "ACTIVE", price: { gt: 0 } },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        description: true,
        shortDescription: true,
        price: true,
        comparePrice: true,
        trackInventory: true,
        quantity: true,
        weight: true,
        brand: true,
        gtin: true,
        ean: true,
        mpn: true,
        googleCategory: true,
        condition: true,
        characteristics: true,
        updatedAt: true,
        images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
        categories: { select: { category: { select: { id: true, parentId: true, isActive: true } } } },
        variants: { select: { name: true, sku: true, price: true, quantity: true, options: true }, orderBy: { sku: "asc" } },
      },
      orderBy: { sku: "asc" },
    }),
  ]);

  const items: FeedItem[] = [];
  for (const product of products) {
    const images = publicImageUrls(product.images.map((i) => i.url));
    if (!images.length) continue;

    const linked = product.categories.map((c) => c.category).filter((c) => c.isActive && tree.byId.has(c.id));
    const leaf = linked.find((c) => c.parentId) ?? linked[0] ?? null;
    const chain: { name: string; slug: string }[] = [];
    let current = leaf ? tree.byId.get(leaf.id) ?? null : null;
    while (current) {
      chain.unshift({ name: current.name, slug: current.slug });
      current = current.parentId ? tree.byId.get(current.parentId) ?? null : null;
    }

    const title = cleanTitle(product.name);
    if (!title) continue;
    const description = cleanDescription(product.description, product.shortDescription, title);
    const taxonomy = googleTaxonomyFor();
    const brand = publicBrand(product.brand);
    const gtin = validGtin(product.gtin, product.ean);
    const mpnRaw = product.mpn?.trim() || null;
    const mpn = mpnRaw && !hasSupplierSku(mpnRaw) && mpnRaw !== product.sku ? mpnRaw.slice(0, 70) : null;
    const price = Number(product.price);
    const compare = product.comparePrice != null ? Number(product.comparePrice) : null;
    const onSale = compare != null && compare > price;
    const weight = product.weight != null && Number(product.weight) > 0 ? Number(product.weight) : null;
    const condition = (CONDITIONS.has(product.condition.toLowerCase()) ? product.condition.toLowerCase() : "new") as FeedItem["condition"];
    const productType = chain.length ? chain.map((c) => c.name).join(" > ") : null;
    const material = characteristic(product.characteristics, ["material", "materials"]);

    const base: FeedItem = {
      id: product.sku,
      itemGroupId: null,
      title,
      description,
      link: absoluteUrl(`/product/${product.slug}`),
      imageLink: images[0],
      additionalImageLinks: images.slice(1, 1 + FEED_ADDITIONAL_IMAGES),
      availability: !product.trackInventory || product.quantity > 0 ? "in_stock" : "out_of_stock",
      quantity: product.trackInventory ? Math.max(0, product.quantity) : null,
      price: onSale ? compare! : price,
      salePrice: onSale ? price : null,
      brand,
      gtin,
      mpn,
      condition,
      googleCategoryId: taxonomy.id,
      googleCategoryName: taxonomy.name,
      productType,
      categoryNames: chain.map((c) => c.name),
      weightKg: weight,
      color: characteristic(product.characteristics, ["colour", "color"]),
      size: null,
      material,
      updatedAt: product.updatedAt,
    };

    const variants = product.variants.filter((v) => v.sku && !hasSupplierSku(v.sku));
    if (variants.length < 2) {
      items.push(base);
      continue;
    }
    for (const variant of variants) {
      const variantPrice = variant.price != null && Number(variant.price) > 0 ? Number(variant.price) : price;
      const variantOnSale = compare != null && compare > variantPrice;
      const label = stripSupplierMentions(variant.name).trim();
      items.push({
        ...base,
        id: variant.sku,
        itemGroupId: product.sku,
        title: label && !title.toLowerCase().includes(label.toLowerCase()) ? cleanTitle(`${title} - ${label}`) : title,
        availability: !product.trackInventory || variant.quantity > 0 ? "in_stock" : "out_of_stock",
        quantity: product.trackInventory ? Math.max(0, variant.quantity) : null,
        price: variantOnSale ? compare! : variantPrice,
        salePrice: variantOnSale ? variantPrice : null,
        color: optionValue(variant.options, ["colour", "color"]) ?? base.color,
        size: optionValue(variant.options, ["size"]),
        material: optionValue(variant.options, ["material"]) ?? base.material,
      });
    }
  }
  return items;
}

export interface ShippingRule {
  country: string;
  service: string;
  price: number;
  minHandling: number | null;
  maxHandling: number | null;
  minTransit: number | null;
  maxTransit: number | null;
}

const DEFAULT_SHIPPING_COUNTRIES: Record<SupportedCurrency, string[]> = {
  USD: ["GB", ...EU_COUNTRY_CODES],
  GBP: ["GB"],
  EUR: EU_COUNTRY_CODES,
};

export function shippingCountries(requested: string | null, currency: SupportedCurrency): string[] {
  const all = ["GB", ...EU_COUNTRY_CODES];
  const code = requested?.toUpperCase();
  if (code === "NONE") return [];
  if (code === "ALL") return all;
  if (code === "EU") return EU_COUNTRY_CODES;
  if (code && all.includes(code)) return [code];
  return DEFAULT_SHIPPING_COUNTRIES[currency];
}

export function shippingRules(_itemPriceInBase: number, countries: string[]): ShippingRule[] {
  return countries.map((country) => ({
    country,
    service: STORE_POLICY.delivery.method,
    price: 0,
    minHandling: 0,
    maxHandling: 1,
    minTransit: 0,
    maxTransit: 0,
  }));
}

export function feedHeaders(contentType: string, cacheSeconds = FEED_CACHE_SECONDS, filename?: string): HeadersInit {
  return {
    "Content-Type": contentType,
    "Cache-Control": `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`,
    "X-Robots-Tag": "noindex",
    ...(filename ? { "Content-Disposition": `inline; filename="${filename}"` } : {}),
  };
}
