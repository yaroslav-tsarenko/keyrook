import { BRAND, SITE_URL } from "@/lib/brand";
import { type FeedContext, type FeedItem, feedMoney, shippingRules } from "./catalog";

const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

export function xmlText(value: string | number): string {
  return String(value)
    .replace(INVALID_XML, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function tag(name: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return `<${name}>${xmlText(value)}</${name}>`;
}

export interface GoogleFeedOptions {
  countries: string[];
}

function googleItem(item: FeedItem, ctx: FeedContext, options: GoogleFeedOptions): string {
  const effective = item.salePrice ?? item.price;
  const parts = [
    tag("g:id", item.id),
    tag("g:title", item.title),
    tag("g:description", item.description),
    tag("g:link", item.link),
    tag("g:image_link", item.imageLink),
    ...item.additionalImageLinks.map((url) => tag("g:additional_image_link", url)),
    tag("g:availability", item.availability),
    tag("g:price", feedMoney(item.price, ctx)),
    item.salePrice != null ? tag("g:sale_price", feedMoney(item.salePrice, ctx)) : "",
    tag("g:condition", item.condition),
    tag("g:brand", item.brand),
    item.gtin ? tag("g:gtin", item.gtin) : "",
    !item.gtin && item.mpn ? tag("g:mpn", item.mpn) : "",
    !item.gtin && !(item.brand && item.mpn) ? tag("g:identifier_exists", "no") : "",
    tag("g:google_product_category", item.googleCategoryId),
    tag("g:product_type", item.productType),
    tag("g:item_group_id", item.itemGroupId),
    tag("g:color", item.color),
    tag("g:size", item.size),
    tag("g:material", item.material),
    item.weightKg != null ? tag("g:shipping_weight", `${Number(item.weightKg.toFixed(3))} kg`) : "",
    ...shippingRules(effective, options.countries).map(
      (rule) =>
        `<g:shipping>${tag("g:country", rule.country)}${tag("g:service", rule.service)}${tag("g:price", feedMoney(rule.price, ctx))}${tag("g:min_handling_time", rule.minHandling)}${tag("g:max_handling_time", rule.maxHandling)}${tag("g:min_transit_time", rule.minTransit)}${tag("g:max_transit_time", rule.maxTransit)}</g:shipping>`,
    ),
  ];
  return `<item>${parts.join("")}</item>`;
}

export function googleFeedXml(items: FeedItem[], ctx: FeedContext, options: GoogleFeedOptions): string {
  const body = items.map((item) => googleItem(item, ctx, options)).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
${tag("title", `${BRAND.name} (${ctx.currency})`)}
${tag("link", SITE_URL)}
${tag("description", BRAND.tagline)}
${body}
</channel>
</rss>
`;
}

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value).replace(INVALID_XML, "").replace(/\r?\n/g, " ");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const META_COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "sale_price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "gtin",
  "mpn",
  "google_product_category",
  "product_type",
  "item_group_id",
  "color",
  "size",
  "material",
  "quantity_to_sell_on_facebook",
  "shipping_weight",
] as const;

export function metaFeedCsv(items: FeedItem[], ctx: FeedContext): string {
  const rows = items.map((item) => {
    const record: Record<(typeof META_COLUMNS)[number], string | number | null> = {
      id: item.id,
      title: item.title.slice(0, 200),
      description: item.description.slice(0, 9999),
      availability: item.availability === "in_stock" ? "in stock" : "out of stock",
      condition: item.condition,
      price: feedMoney(item.price, ctx),
      sale_price: item.salePrice != null ? feedMoney(item.salePrice, ctx) : null,
      link: item.link,
      image_link: item.imageLink,
      additional_image_link: item.additionalImageLinks.length ? item.additionalImageLinks.join(",") : null,
      brand: item.brand ?? BRAND.name,
      gtin: item.gtin,
      mpn: item.gtin ? null : item.mpn,
      google_product_category: item.googleCategoryId,
      product_type: item.productType,
      item_group_id: item.itemGroupId,
      color: item.color,
      size: item.size,
      material: item.material,
      quantity_to_sell_on_facebook: item.quantity,
      shipping_weight: item.weightKg != null ? `${Number(item.weightKg.toFixed(3))} kg` : null,
    };
    return META_COLUMNS.map((column) => csvCell(record[column])).join(",");
  });
  return `${META_COLUMNS.join(",")}\n${rows.join("\n")}\n`;
}
