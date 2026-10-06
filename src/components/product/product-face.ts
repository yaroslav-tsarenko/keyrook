import { productTypeDef, regionDef, type KeySummary } from "@/lib/keys/taxonomy";
import { platformInfo, regionSentence, regionTag, typeSentence, typeTag, typeTone, type PlatformTone, type TypeTone } from "@/lib/catalog/platforms";

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number | string;
  comparePrice?: number | string | null;
  quantity?: number;
  images?: { url: string; alt?: string | null }[];
  imageUrl?: string | null;
  screenshotUrl?: string | null;
  category?: string | null;
  createdAt?: string | Date | null;
  isNew?: boolean;
  key?: KeySummary | null;
}

export interface ProductFace {
  title: string;
  kind: string;
  typeLabel: string | null;
  typeTag: string | null;
  typeTone: TypeTone;
  typeSentence: string;
  platform: string | null;
  platformShort: string | null;
  platformKey: string | null;
  platformSlug: string | null;
  tone: PlatformTone;
  region: string | null;
  regionShort: string | null;
  regionTag: string | null;
  regionSentence: string;
  regionLocked: boolean;
  edition: string | null;
  detail: string | null;
  facts: string | null;
  needsBase: boolean;
  value: string | null;
}

const LANGUAGE_CODES: Record<string, string> = {
  english: "EN",
  german: "DE",
  french: "FR",
  spanish: "ES",
  "spanish (latin america)": "ES-LA",
  "spanish (spain)": "ES",
  italian: "IT",
  japanese: "JA",
  korean: "KO",
  polish: "PL",
  portuguese: "PT",
  "portuguese (brazil)": "PT-BR",
  "portuguese - brazil": "PT-BR",
  russian: "RU",
  "chinese (simplified)": "ZH-HANS",
  "simplified chinese": "ZH-HANS",
  "chinese (traditional)": "ZH-HANT",
  "traditional chinese": "ZH-HANT",
  turkish: "TR",
  ukrainian: "UK",
  dutch: "NL",
  czech: "CS",
  swedish: "SV",
  norwegian: "NO",
  danish: "DA",
  finnish: "FI",
  hungarian: "HU",
  romanian: "RO",
  greek: "EL",
  arabic: "AR",
  thai: "TH",
  vietnamese: "VI",
  indonesian: "ID",
};

export function languageCode(name: string): string {
  return LANGUAGE_CODES[name.trim().toLowerCase()] ?? name.trim().slice(0, 2).toUpperCase();
}

export function languageFacts(languages: string[], max = 3): string | null {
  if (!languages.length) return null;
  const codes = [...new Set(languages.map(languageCode))];
  const head = codes.slice(0, max).join(" ");
  return codes.length > max ? `${head} +${codes.length - max}` : head;
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: Number.isInteger(amount) ? 0 : 2, maximumFractionDigits: 2 }).format(amount);
}

export function faceValueText(key: KeySummary | null | undefined, name: string): string | null {
  if (key?.faceValue && key.faceCurrency) return money(key.faceValue, key.faceCurrency);
  const match = /([€£$])\s?(\d+(?:[.,]\d{1,2})?)/.exec(name) ?? /(\d+(?:[.,]\d{1,2})?)\s?(EUR|GBP|USD)\b/i.exec(name);
  if (!match) return null;
  if (/[€£$]/.test(match[1])) return `${match[1]}${match[2]}`;
  const symbol = { EUR: "€", GBP: "£", USD: "$" }[match[2].toUpperCase()] ?? "";
  return `${symbol}${match[1]}`;
}

export function productFace(name: string, key: KeySummary | null | undefined): ProductFace {
  if (!key) {
    return {
      title: name,
      kind: "game",
      typeLabel: null,
      typeTag: null,
      typeTone: "game",
      typeSentence: "Product",
      platform: null,
      platformShort: null,
      platformKey: null,
      platformSlug: null,
      tone: "other",
      region: null,
      regionShort: null,
      regionTag: null,
      regionSentence: "",
      regionLocked: false,
      edition: null,
      detail: null,
      facts: null,
      needsBase: false,
      value: null,
    };
  }
  const platform = platformInfo(key.platform);
  const region = regionDef(key.region);
  const kind = key.productType;
  const value = kind === "gift-card" || kind === "top-up" ? faceValueText(key, key.title || name) : null;
  const facts =
    kind === "gift-card" || kind === "top-up"
      ? value
        ? `Value ${value}`
        : null
      : kind === "subscription"
        ? key.validity
        : kind === "game" || kind === "dlc"
          ? [languageFacts(key.languages), kind === "dlc" ? "Needs the base game" : null].filter(Boolean).join(" · ") || null
          : key.validity ?? languageFacts(key.languages);
  return {
    title: key.title || name,
    kind,
    typeLabel: productTypeDef(kind)?.singular ?? null,
    typeTag: typeTag(kind),
    typeTone: typeTone(kind),
    typeSentence: typeSentence(kind),
    platform: platform.label,
    platformShort: platform.short,
    platformKey: platform.key,
    platformSlug: platform.slug,
    tone: platform.tone,
    region: region?.label ?? null,
    regionShort: region?.short ?? null,
    regionTag: regionTag(key.region),
    regionSentence: regionSentence(key.region),
    regionLocked: key.region !== "global",
    edition: key.edition,
    detail: [key.edition, key.validity, key.releaseYear ? String(key.releaseYear) : null].filter(Boolean).slice(0, 2).join(" · ") || null,
    facts,
    needsBase: kind === "dlc",
    value,
  };
}

export function shelfAspect(products: CatalogProduct[]): "card" | undefined {
  return products.length > 0 && products.every((p) => productFace(p.name, p.key).typeTone === "giftcard") ? "card" : undefined;
}
