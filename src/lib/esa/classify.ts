import { createHash } from "node:crypto";
import { catalogConfig, type CatalogConfig } from "@/config/catalog";
import { GENRES, platformDef, productTypeDef, regionDef, showsSystemRequirements, type PlatformKey, type ProductTypeKey, type RegionKey } from "@/lib/keys/taxonomy";
import { mentionsSupplier, stripSupplierMentions } from "@/lib/utils/supplier";
import type { EsaOffer, EsaProduct } from "./types";

export type RejectReason =
  | "no_name"
  | "non_english_name"
  | "sanctioned_region"
  | "region_not_sold"
  | "vpn"
  | "restricted_language"
  | "adult"
  | "gambling"
  | "account_or_gift"
  | "excluded_platform"
  | "excluded_publisher"
  | "preorder"
  | "missing_cover"
  | "no_stock"
  | "no_price";

export interface SystemRequirement {
  system: string;
  lines: string[];
}

export interface Classified {
  esaId: number;
  esaProductId: string;
  rawName: string;
  rawPlatform: string | null;
  rawRegion: string | null;
  regionId: number | null;
  title: string;
  displayName: string;
  dedupeKey: string;
  productType: ProductTypeKey;
  platform: PlatformKey;
  region: RegionKey;
  regionNote: string | null;
  languages: string[];
  genres: string[];
  releaseDate: Date | null;
  releaseYear: number | null;
  developers: string[];
  publishers: string[];
  ageRating: string | null;
  edition: string | null;
  systemRequirements: SystemRequirement[] | null;
  activationNotes: string | null;
  metacriticScore: number | null;
  videoId: string | null;
  faceValue: number | null;
  faceCurrency: string | null;
  validity: string | null;
  description: string;
  cover: string;
  screenshots: string[];
  cost: number;
  offerId: string | null;
  qty: number;
  offers: number;
}

export type ClassifyResult = { ok: true; item: Classified } | { ok: false; reason: RejectReason };

const NON_LATIN = /[Ѐ-ӿԀ-ԯͰ-Ͽ֐-׿؀-ۿ぀-ヿ㐀-鿿가-힯]/;

function lower(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termTest(terms: string[]): RegExp {
  const parts = terms.map((t) => {
    const body = escapeRe(t.trim());
    const start = /^[a-z0-9]/i.test(t.trim()) ? "\\b" : "";
    const end = /[a-z0-9]$/i.test(t.trim()) ? "\\b" : "";
    return `${start}${body}${end}`;
  });
  return new RegExp(parts.join("|"), "i");
}

const PROMO_SENTENCE = /\b(?:buy cheap|cheap (?:cd )?keys?|instant(?:ly)? deliver\w*|instant download|best prices?|lowest prices?|100\s?%|official (?:cd )?keys?|original keys?|guaranteed)\b/i;

function dropPromoSentences(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) => !PROMO_SENTENCE.test(sentence) && !mentionsSupplier(sentence))
        .join(" "),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function plainText(html: string | null | undefined): string {
  if (!html) return "";
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return stripSupplierMentions(dropPromoSentences(text));
}

const RAW_PLATFORMS: [RegExp, PlatformKey][] = [
  [/^steam/i, "steam"],
  [/^(origin|ea app|ea play|ea)$/i, "ea-app"],
  [/^(uplay|ubisoft( connect)?)$/i, "ubisoft-connect"],
  [/^epic( games)?( store)?$/i, "epic"],
  [/^gog/i, "gog"],
  [/^battle\.?net$/i, "battle-net"],
  [/^rockstar/i, "rockstar"],
  [/^(xbox|microsoft store)/i, "xbox"],
  [/^(playstation|psn|ps ?[45])/i, "playstation"],
  [/^nintendo/i, "nintendo"],
];

const NAME_PLATFORMS: [RegExp, PlatformKey][] = [
  [/\b(ea app|origin)\b/i, "ea-app"],
  [/\b(ubisoft connect|uplay)\b/i, "ubisoft-connect"],
  [/\bepic games\b/i, "epic"],
  [/\bgog(\.com)?\b/i, "gog"],
  [/\bbattle\.?net\b/i, "battle-net"],
  [/\brockstar( games)?( launcher)?\b|\bsocial club\b/i, "rockstar"],
  [/\bxbox\b/i, "xbox"],
  [/\b(playstation|psn|ps ?[45])\b/i, "playstation"],
  [/\bnintendo\b|\beshop\b/i, "nintendo"],
  [/\bsteam\b/i, "steam"],
];

export function detectPlatform(rawPlatform: string | null | undefined, name: string): PlatformKey {
  const fromName = NAME_PLATFORMS.find(([re]) => re.test(name))?.[1] ?? null;
  const raw = (rawPlatform ?? "").trim();
  const fromRaw = RAW_PLATFORMS.find(([re]) => re.test(raw))?.[1] ?? null;
  if (fromName && fromRaw && fromName !== fromRaw) {
    const launcherNamed = /\b(cd[- ]?key|key|code|account)\b/i.test(name) || ["ea-app", "ubisoft-connect", "epic", "gog", "battle-net", "rockstar"].includes(fromName);
    return launcherNamed ? fromName : fromRaw;
  }
  return fromRaw ?? fromName ?? "other";
}

const SOFTWARE = /\b(windows (?:1[01]|server)|microsoft office|office 20\d\d|office 365|microsoft 365|antivirus|anti-virus|internet security|total security|norton|bitdefender|eset|avast|avg|mcafee|adobe|autodesk|vmware|parallels|nero|corel|wondershare|cyberlink|ccleaner|malwarebytes|acronis|driver booster|iobit|project 20\d\d|visio)\b/i;
const GAME_SUBSCRIPTION = /\b(game pass|ps plus|playstation plus|ea play|ubisoft\+|nintendo switch online|xbox live gold)(?=\W|$)/i;
const SUBSCRIPTION = /\b(subscription|membership)\b/i;
const DURATION = /\b(\d{1,2})\s*(day|days|month|months|year|years)\b/i;
const GIFT_CARD = /\b(gift card|giftcard|gift code|wallet card|wallet code|eshop card|psn card|network card|store card|prepaid card|xbox card|steam wallet)\b/i;
const MONEY = /(?:(€|\$|£)\s?(\d{1,4}(?:[.,]\d{1,2})?))|(?:(\d{1,4}(?:[.,]\d{1,2})?)\s?(€|\$|£|eur|usd|gbp)\b)|(?:\b(eur|usd|gbp)\s?(\d{1,4}(?:[.,]\d{1,2})?))/i;
const TOP_UP = /\b(v-?bucks|fc points|fifa points|apex coins|cod points|call of duty points|robux|riot points|valorant points|minecoins|shark cash|gold bars|top[- ]?up|in-game currency|\d[\d,. ]*\s*(coins|gems|credits|points|crowns|diamonds|platinum|silver|tokens))\b/i;
const DLC = /\b(dlc|season pass|expansion|add-?on|soundtrack|ost|pack|upgrade|character pass|battle pass|year \d+ pass|bonus content|costume|skin set)\b/i;

export function detectType(name: string, tags: string[], genres: string[]): ProductTypeKey {
  const t = tags.map((x) => x.toLowerCase());
  const g = genres.map((x) => x.toLowerCase());
  if (GAME_SUBSCRIPTION.test(name)) return "subscription";
  if (t.includes("software") || g.includes("software") || SOFTWARE.test(name)) return "software";
  if (SUBSCRIPTION.test(name) || g.includes("subscription")) return "subscription";
  if (GIFT_CARD.test(name) || (t.includes("prepaid") && MONEY.test(name))) return "gift-card";
  if (TOP_UP.test(name)) return "top-up";
  if (t.includes("dlc") || DLC.test(name)) return "dlc";
  if (t.includes("prepaid")) return MONEY.test(name) ? "gift-card" : "top-up";
  return "game";
}

const EDITIONS = [
  "Game of the Year Edition",
  "GOTY Edition",
  "Digital Deluxe Edition",
  "Super Deluxe Edition",
  "Deluxe Edition",
  "Ultimate Edition",
  "Gold Edition",
  "Premium Edition",
  "Complete Edition",
  "Definitive Edition",
  "Legendary Edition",
  "Collector's Edition",
  "Enhanced Edition",
  "Special Edition",
  "Anniversary Edition",
  "Standard Edition",
  "Director's Cut",
  "Cross-Gen Bundle",
  "GOTY",
];

export function detectEdition(name: string): string | null {
  const n = name.toLowerCase();
  const hit = EDITIONS.find((e) => n.includes(e.toLowerCase()));
  if (!hit) return null;
  return hit === "GOTY" || hit === "GOTY Edition" ? "Game of the Year Edition" : hit;
}

const REGION_RAW: [RegExp, RegionKey][] = [
  [/^(region free|global|worldwide|world wide)$/i, "global"],
  [/^(europe|eu|european union)$/i, "europe"],
  [/^(united kingdom|uk|great britain|gb)$/i, "uk"],
  [/^(united states|us|usa)$/i, "us"],
  [/^(north america|na)$/i, "north-america"],
];

const REGION_IN_NAME: [RegExp, RegionKey | "blocked"][] = [
  [/\b(ru|cis|russia|ru\/cis|cis\/ru)\b/i, "blocked"],
  [/\b(latam|row|asia|tr|ar|in|br|cn|jp|kr|mena)\b(?=\s*(?:key|cd key|code|steam|xbox|psn|\)|\]|$))/i, "blocked"],
  [/\b(eu|europe)\b(?=\s*(?:key|cd key|code|steam|xbox|psn|\)|\]|$))/i, "europe"],
  [/\b(uk|united kingdom)\b(?=\s*(?:key|cd key|code|steam|xbox|psn|\)|\]|$))/i, "uk"],
  [/\b(us|usa|united states)\b(?=\s*(?:key|cd key|code|steam|xbox|psn|\)|\]|$))/i, "us"],
  [/\b(na|north america)\b(?=\s*(?:key|cd key|code|steam|xbox|psn|\)|\]|$))/i, "north-america"],
];

export function detectRegion(raw: string | null | undefined, name: string, config: CatalogConfig = catalogConfig): RegionKey | "sanctioned" | "not_sold" {
  const r = (raw ?? "").trim();
  if (termTest(config.exclude.regionTerms).test(r)) return "sanctioned";
  let region: RegionKey | null = REGION_RAW.find(([re]) => re.test(r))?.[1] ?? null;
  if (!region && r) return "not_sold";
  for (const [re, hint] of REGION_IN_NAME) {
    if (!re.test(name)) continue;
    if (hint === "blocked") return /\b(ru|cis|russia)\b/i.test(name) ? "sanctioned" : "not_sold";
    if (!region || region === "global") region = hint;
    break;
  }
  region ??= "global";
  return config.include.regions.includes(region) ? region : "not_sold";
}

const GENRE_MAP: [RegExp, string][] = [
  [/shoot|fps|tps/i, "shooter"],
  [/rpg|role/i, "rpg"],
  [/strateg|rts|4x|tower defen/i, "strategy"],
  [/simulat|sim\b|management|tycoon/i, "simulation"],
  [/sport|football|soccer|basketball|golf/i, "sports"],
  [/racing|driving|cars/i, "racing"],
  [/fight|beat.?em|hack and slash/i, "fighting"],
  [/horror/i, "horror"],
  [/surviv/i, "survival"],
  [/open world|sandbox/i, "open-world"],
  [/puzzle|hidden object|point.{0,3}click/i, "puzzle"],
  [/platform/i, "platformer"],
  [/story|visual novel|narrative/i, "story-rich"],
  [/mmo|massively/i, "mmo"],
  [/co-?op|multiplayer/i, "co-op"],
  [/indie/i, "indie"],
  [/casual|family|party/i, "casual"],
  [/\bvr\b|virtual reality/i, "vr"],
  [/adventure/i, "adventure"],
  [/action/i, "action"],
];

export function mapGenres(raw: string[]): string[] {
  const out = new Set<string>();
  for (const g of raw) {
    for (const [re, key] of GENRE_MAP) {
      if (re.test(g)) {
        out.add(key);
        break;
      }
    }
  }
  const order = GENRES.map((g) => g.key);
  return [...out].sort((a, b) => order.indexOf(a) - order.indexOf(b)).slice(0, 4);
}

const LANGUAGE_ALIASES: Record<string, string> = {
  eng: "English",
  en: "English",
  "english (us)": "English",
  "english (uk)": "English",
  ger: "German",
  de: "German",
  fr: "French",
  es: "Spanish",
  "spanish - spain": "Spanish",
  "spanish - latin america": "Spanish (Latin America)",
  "portuguese - brazil": "Portuguese (Brazil)",
  "simplified chinese": "Chinese (Simplified)",
  "traditional chinese": "Chinese (Traditional)",
};

export function normalizeLanguages(raw: string[]): string[] {
  const seen = new Set<string>();
  for (const value of raw) {
    const clean = value.trim();
    if (!clean) continue;
    const alias = LANGUAGE_ALIASES[clean.toLowerCase()];
    const name = alias ?? clean.replace(/\b\w/g, (c) => c.toUpperCase());
    seen.add(name);
  }
  const list = [...seen];
  return list.sort((a, b) => (a === "English" ? -1 : b === "English" ? 1 : a.localeCompare(b, "en-GB")));
}

const TAIL_NOISE = [
  /\s*[-–|:/]\s*$/,
  /\s+(?:[a-z]{2}(?:\/[a-z]{2})+\s+)?languages?\s+only$/i,
  /\s+xbox one\s*\/\s*(?:xbox\s+)?series x\|s$/i,
  /\s+xbox one\s*\/\s*windows 1[01]$/i,
  /\s*\((?:pc|mac|eu|us|uk|global|row|na|europe|north america|region free|ww)\)\s*$/i,
  /\s*\[(?:pc|mac|eu|us|uk|global|row|na)\]\s*$/i,
  /\s+(?:cd[- ]?key|key|code|digital code|digital download|download code|activation code|activation)$/i,
  /\s+(?:steam|origin|ea app|uplay|ubisoft connect|gog(?:\.com)?|epic games|battle\.net|rockstar(?: games)?(?: launcher)?|xbox(?: one| series x\|s| one \/ series x\|s| live)?|psn|playstation(?: network| 4| 5)?|ps[45]|nintendo(?: switch(?: 2)?)?|microsoft store|windows 10|windows)$/i,
  /\s+(?:eu|us|uk|global|row|na|europe|north america|region free|ww|worldwide)$/i,
  /\s+(?:pc|mac|for pc)$/i,
];

export function cleanTitle(name: string): string {
  let out = stripSupplierMentions(name)
    .replace(/[™®©]/g, "")
    .replace(/\s+(?:(?:eu|us|uk|na|global)\s+)?(?:cd\s+)?key(?=\s*\()/i, "")
    .replace(/\s+/g, " ")
    .trim();
  for (let i = 0; i < 10; i++) {
    const before = out;
    for (const re of TAIL_NOISE) out = out.replace(re, "").trim();
    if (out === before) break;
  }
  return out;
}

function baseTitle(title: string, edition: string | null): string {
  let out = title;
  if (edition) out = out.replace(new RegExp(`\\s*[-–:]?\\s*${escapeRe(edition)}`, "i"), "");
  out = out.replace(/\bGOTY\b/i, "");
  return out.trim();
}

export function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stableHash(value: string): string {
  return createHash("sha1").update(value).digest("hex");
}

function parseFace(name: string): { value: number; currency: string } | null {
  const m = MONEY.exec(name);
  if (!m) return null;
  const symbol = (m[1] ?? m[4] ?? m[5] ?? "").toLowerCase();
  const amount = Number((m[2] ?? m[3] ?? m[6] ?? "").replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const currency = symbol === "€" || symbol === "eur" ? "EUR" : symbol === "£" || symbol === "gbp" ? "GBP" : "USD";
  return { value: amount, currency };
}

function parseValidity(name: string): string | null {
  const m = DURATION.exec(name);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase().replace(/s$/, "");
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

function firstString(...values: (string | null | undefined)[]): string | null {
  for (const v of values) if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function bestOffer(product: EsaProduct, minQty: number): { offer: EsaOffer | null; price: number; qty: number; count: number } {
  const offers = (product.offers ?? []).filter((o) => o.price > 0 && (o.textQty ?? o.qty) >= minQty && !o.isPreorder);
  if (offers.length) {
    offers.sort((a, b) => a.price - b.price);
    return { offer: offers[0], price: offers[0].price, qty: offers.reduce((s, o) => s + (o.textQty ?? o.qty), 0), count: offers.length };
  }
  const qty = product.textQty ?? product.qty;
  return { offer: null, price: product.price, qty: product.price > 0 && qty >= minQty ? qty : 0, count: product.offersCount ?? 0 };
}

function youtubeId(product: EsaProduct): string | null {
  const id = product.videos?.find((v) => v.video_id && /^[A-Za-z0-9_-]{11}$/.test(v.video_id))?.video_id;
  return id ?? null;
}

function systemRequirements(product: EsaProduct): SystemRequirement[] | null {
  const rows = (product.systemRequirements ?? [])
    .map((r) => ({
      system: (r.system ?? "").trim() || "Windows",
      lines: (r.requirement ?? []).map((line) => plainText(line)).filter((line) => line && line.length < 300),
    }))
    .filter((r) => r.lines.length > 0);
  return rows.length ? rows : null;
}

function releaseOf(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  return year >= 1980 && year <= new Date().getUTCFullYear() + 1 ? d : null;
}

export function classifyProduct(product: EsaProduct, config: CatalogConfig = catalogConfig): ClassifyResult {
  const rawName = firstString(product.name, product.originalName);
  if (!rawName) return { ok: false, reason: "no_name" };
  if (config.include.requireEnglishName && NON_LATIN.test(rawName)) return { ok: false, reason: "non_english_name" };

  const tags = product.tags ?? [];
  const rawGenres = product.genres ?? [];
  const activation = plainText(product.activationDetails);
  const textBlob = [rawName, product.regionalLimitations, activation].join(" \n ");

  if (/\bvpn\b/i.test(textBlob)) return { ok: false, reason: "vpn" };
  if (termTest(config.exclude.titleTerms).test(rawName)) return { ok: false, reason: /vpn/i.test(rawName) ? "vpn" : "sanctioned_region" };
  if (/\baccount\b|\balter ?gift\b|\bgift\s*$|\bgift\s+(?:link|copy)\b|\(gift\)/i.test(rawName)) return { ok: false, reason: "account_or_gift" };

  const adult = termTest(config.exclude.adultTerms);
  if (adult.test(rawName) || [...tags, ...rawGenres].some((t) => adult.test(t)) || /^(ao|adults only)$/i.test(product.ageRating ?? "")) return { ok: false, reason: "adult" };
  if (termTest(config.exclude.gamblingTerms).test(rawName) || [...tags, ...rawGenres].some((t) => /gambl|casino/i.test(t))) return { ok: false, reason: "gambling" };

  const rawPlatform = firstString(product.platform);
  if (rawPlatform && config.exclude.platforms.some((p) => lower(rawPlatform) === p)) return { ok: false, reason: "excluded_platform" };
  if ((product.publishers ?? []).some((p) => config.exclude.publishers.some((x) => lower(p).includes(x)))) return { ok: false, reason: "excluded_publisher" };
  if (product.isPreorder && !config.include.allowPreorders) return { ok: false, reason: "preorder" };

  const region = detectRegion(product.regionalLimitations, rawName, config);
  if (region === "sanctioned") return { ok: false, reason: "sanctioned_region" };
  if (region === "not_sold") return { ok: false, reason: "region_not_sold" };

  const languages = normalizeLanguages(product.languages ?? []);
  if (languages.length > 0 && languages.every((l) => config.exclude.languagesOnly.includes(l))) return { ok: false, reason: "restricted_language" };

  const cover = firstString(product.images?.cover?.url, product.coverImageOriginal, product.coverImage, product.images?.cover?.thumbnail);
  if (config.include.requireCover && !cover) return { ok: false, reason: "missing_cover" };

  const { offer, price, qty, count } = bestOffer(product, config.include.minTextQty);
  if (!(price > 0)) return { ok: false, reason: "no_price" };
  if (qty < config.include.minTextQty) return { ok: false, reason: "no_stock" };

  const platform = detectPlatform(rawPlatform, rawName);
  const productType = detectType(rawName, tags, rawGenres);
  const typeDef = productTypeDef(productType)!;
  const title = cleanTitle(rawName) || rawName;
  const edition = productType === "game" || productType === "dlc" ? detectEdition(title) : null;
  const validity = productType === "subscription" || productType === "software" ? parseValidity(rawName) : null;
  const face = productType === "gift-card" ? parseFace(rawName) : null;
  const releaseDate = typeDef.hasGameFacts ? releaseOf(product.releaseDate) : null;
  const regionLabel = regionDef(region)!.label;
  const platformLabel = platformDef(platform)!.label;

  const dedupeParts = [productType, normalizeKey(baseTitle(title, edition)), normalizeKey(edition ?? ""), platform, region];
  if (face) dedupeParts.push(`${face.value}${face.currency}`);
  if (validity) dedupeParts.push(validity);
  const dedupeKey = dedupeParts.join("|");

  const displayName =
    productType === "game" || productType === "dlc" || productType === "software" || productType === "top-up"
      ? `${title} (${platformLabel}${region === "global" ? "" : `, ${regionLabel}`})`
      : region === "global"
        ? title
        : `${title} (${regionLabel})`;

  const screenshots = (product.images?.screenshots ?? [])
    .map((s) => firstString(s.url, s.thumbnail))
    .filter((u): u is string => Boolean(u))
    .filter((u) => u !== cover)
    .slice(0, 6);

  return {
    ok: true,
    item: {
      esaId: product.kinguinId,
      esaProductId: product.productId,
      rawName,
      rawPlatform,
      rawRegion: firstString(product.regionalLimitations),
      regionId: product.regionId ?? null,
      title,
      displayName,
      dedupeKey,
      productType,
      platform,
      region,
      regionNote: firstString(product.regionalLimitations),
      languages,
      genres: typeDef.hasGameFacts ? mapGenres(rawGenres) : [],
      releaseDate,
      releaseYear: releaseDate ? releaseDate.getUTCFullYear() : null,
      developers: typeDef.hasGameFacts ? (product.developers ?? []).map((d) => d.trim()).filter(Boolean).slice(0, 4) : [],
      publishers: (product.publishers ?? []).map((d) => stripSupplierMentions(d.trim())).filter(Boolean).slice(0, 4),
      ageRating: typeDef.hasGameFacts ? firstString(product.ageRating) : null,
      edition,
      systemRequirements: showsSystemRequirements(productType, platform) ? systemRequirements(product) : null,
      activationNotes: activation || null,
      metacriticScore: typeDef.hasGameFacts && product.metacriticScore && product.metacriticScore > 0 && product.metacriticScore <= 100 ? Math.round(product.metacriticScore) : null,
      videoId: typeDef.hasGameFacts ? youtubeId(product) : null,
      faceValue: face?.value ?? null,
      faceCurrency: face?.currency ?? null,
      validity,
      description: plainText(product.description),
      cover: cover!,
      screenshots: typeDef.hasGameFacts ? screenshots : [],
      cost: Math.round(price * 100) / 100,
      offerId: offer?.offerId ?? product.cheapestOfferId?.[0] ?? null,
      qty,
      offers: Math.max(count, 1),
    },
  };
}
