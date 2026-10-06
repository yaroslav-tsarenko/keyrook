const SUPPLIER_TEST = /\bkinguin(?:\.net)?\b|\besa\s+integration\b/i;

const SUPPLIER_PHRASE = /\s*(?:on|from|by|via|at)?\s*\bkinguin(?:\.net)?\b(?:\s+(?:marketplace|store|platform|support|team))?/gi;

const SUPPLIER_HOST_TEST = /(?:^|\.)kinguin\.net$/i;

export function mentionsSupplier(value: string | null | undefined): boolean {
  return Boolean(value && SUPPLIER_TEST.test(value));
}

export function publicBrand(brand: string | null | undefined): string | null {
  if (!brand || mentionsSupplier(brand)) return null;
  return brand;
}

export function stripSupplierMentions(value: string): string {
  if (!mentionsSupplier(value)) return value;
  return value
    .replace(SUPPLIER_PHRASE, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:!?)])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .replace(/^[\s,.;:\-–—|]+|[\s,;:\-–—|]+$/g, "")
    .trim();
}

export function isSupplierHost(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return SUPPLIER_HOST_TEST.test(new URL(url, "https://local.invalid").hostname);
  } catch {
    return false;
  }
}

export function isBlockedImageHost(url: string | null | undefined): boolean {
  return isSupplierHost(url);
}

export function hasSupplierSku(value: string | null | undefined): boolean {
  return mentionsSupplier(value);
}

export function scrubSupplierText(value: string): string {
  return stripSupplierMentions(value);
}

const CLEARED_KEYS = new Set(["brand", "subtitle", "badgeText", "ctaLabel", "discountText", "alt"]);

const STRIPPED_KEYS = new Set([
  "name", "title", "description", "shortDescription", "metaTitle", "metaDescription",
  "label", "content", "viewAllLabel", "productName", "variantName",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function sanitizeSupplierData<T>(value: T): T {
  if (Array.isArray(value)) {
    value.forEach((entry) => sanitizeSupplierData(entry));
    return value;
  }
  if (!isPlainObject(value)) return value;

  const record: Record<string, unknown> = value;
  for (const [key, entry] of Object.entries(record)) {
    if (typeof entry === "string") {
      if (!mentionsSupplier(entry)) continue;
      if (CLEARED_KEYS.has(key)) record[key] = null;
      else if (STRIPPED_KEYS.has(key)) record[key] = stripSupplierMentions(entry);
    } else if (typeof entry === "object" && entry !== null) {
      sanitizeSupplierData(entry);
    }
  }
  return value;
}
