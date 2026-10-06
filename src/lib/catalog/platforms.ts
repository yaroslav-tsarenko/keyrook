import { platformDef, productTypeDef, regionDef, type PlatformKey, type ProductTypeKey } from "@/lib/keys/taxonomy";
import { activationFor } from "@/config/activation";

export type PlatformTone = "steam" | "epic" | "ea" | "ubisoft" | "gog" | "battlenet" | "xbox" | "playstation" | "nintendo" | "rockstar" | "other";
export type TypeTone = "game" | "dlc" | "giftcard" | "subscription" | "software";

const TONE: Record<PlatformKey, PlatformTone> = {
  steam: "steam",
  epic: "epic",
  "ea-app": "ea",
  "ubisoft-connect": "ubisoft",
  gog: "gog",
  "battle-net": "battlenet",
  xbox: "xbox",
  playstation: "playstation",
  nintendo: "nintendo",
  rockstar: "rockstar",
  other: "other",
};

const SHORT: Record<PlatformKey, string> = {
  steam: "Steam",
  epic: "Epic Games",
  "ea-app": "EA app",
  "ubisoft-connect": "Ubisoft Connect",
  gog: "GOG",
  "battle-net": "Battle.net",
  xbox: "Xbox",
  playstation: "PlayStation",
  nintendo: "Nintendo",
  rockstar: "Rockstar",
  other: "Other",
};

const TYPE_TONE: Record<ProductTypeKey, TypeTone> = {
  game: "game",
  dlc: "dlc",
  "gift-card": "giftcard",
  "top-up": "giftcard",
  subscription: "subscription",
  software: "software",
};

const TYPE_TAG: Record<ProductTypeKey, string | null> = {
  game: null,
  dlc: "DLC",
  "gift-card": "Gift card",
  "top-up": "Top-up",
  subscription: "Subscription",
  software: "Software",
};

const TYPE_SENTENCE: Record<ProductTypeKey, string> = {
  game: "Base game",
  dlc: "Downloadable content",
  "gift-card": "Gift card",
  "top-up": "In-game currency top-up",
  subscription: "Subscription",
  software: "Software licence",
};

export const PC_LAUNCHERS = new Set<string>(["steam", "epic", "ea-app", "ubisoft-connect", "gog", "battle-net", "rockstar"]);

export interface PlatformInfo {
  key: string;
  slug: string;
  tone: PlatformTone;
  label: string;
  short: string;
  launcher: boolean;
  redeemUrl: string | null;
}

export function platformInfo(raw: string | null | undefined): PlatformInfo {
  const def = platformDef(raw);
  const key = (def?.key ?? "other") as PlatformKey;
  return {
    key,
    slug: def?.slug ?? "other",
    tone: TONE[key],
    label: def?.label ?? (raw || "Other"),
    short: def ? SHORT[key] : raw || "Other",
    launcher: PC_LAUNCHERS.has(key),
    redeemUrl: activationFor(key)?.redeemUrl ?? null,
  };
}

export function typeTone(kind: string | null | undefined): TypeTone {
  return TYPE_TONE[(kind ?? "game") as ProductTypeKey] ?? "game";
}

export function typeTag(kind: string | null | undefined): string | null {
  return TYPE_TAG[(kind ?? "game") as ProductTypeKey] ?? null;
}

export function typeSentence(kind: string | null | undefined): string {
  return TYPE_SENTENCE[(kind ?? "game") as ProductTypeKey] ?? productTypeDef(kind)?.singular ?? "Product";
}

export function regionTag(region: string | null | undefined): string {
  const def = regionDef(region);
  if (!def) return (region ?? "").toUpperCase();
  return def.key === "global" ? "Global" : def.short;
}

export function regionSentence(region: string | null | undefined): string {
  const def = regionDef(region);
  if (!def || def.key === "global") return "No regional lock";
  if (def.key === "europe") return "Activates only on accounts registered in the EU, EEA, UK and Switzerland";
  return `Activates only on accounts registered in ${def.label === "North America" ? "the United States or Canada" : def.key === "us" ? "the United States" : def.label === "United Kingdom" ? "the United Kingdom" : def.label}`;
}

export function regionLabel(region: string | null | undefined): string {
  return regionDef(region)?.label ?? (region || "Unknown");
}
