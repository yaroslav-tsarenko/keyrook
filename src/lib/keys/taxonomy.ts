export type ProductTypeKey = "game" | "dlc" | "subscription" | "gift-card" | "top-up" | "software";

export type PlatformKey =
  | "steam"
  | "epic"
  | "ea-app"
  | "ubisoft-connect"
  | "gog"
  | "battle-net"
  | "xbox"
  | "playstation"
  | "nintendo"
  | "rockstar"
  | "other";

export type RegionKey = "global" | "europe" | "uk" | "us" | "north-america";

export interface ProductTypeDef {
  key: ProductTypeKey;
  label: string;
  singular: string;
  slug: string;
  lead: string;
  hasGameFacts: boolean;
  hasSystemRequirements: boolean;
}

export const PRODUCT_TYPES: ProductTypeDef[] = [
  {
    key: "game",
    label: "Games",
    singular: "Game",
    slug: "games",
    lead: "Full games as activation keys. Platform, activation region and supported languages are listed on every product.",
    hasGameFacts: true,
    hasSystemRequirements: true,
  },
  {
    key: "dlc",
    label: "DLC & expansions",
    singular: "DLC",
    slug: "dlc",
    lead: "Expansions, season passes and add-ons. Each one needs the base game on the same platform and in the same region.",
    hasGameFacts: true,
    hasSystemRequirements: true,
  },
  {
    key: "subscription",
    label: "Subscriptions",
    singular: "Subscription",
    slug: "subscriptions",
    lead: "Membership codes with a fixed duration. The duration and the account region the code works with are shown on each product.",
    hasGameFacts: false,
    hasSystemRequirements: false,
  },
  {
    key: "gift-card",
    label: "Gift cards",
    singular: "Gift card",
    slug: "gift-cards",
    lead: "Store balance codes for console and PC stores. A card only adds balance to an account set to the card's region.",
    hasGameFacts: false,
    hasSystemRequirements: false,
  },
  {
    key: "top-up",
    label: "Top-ups",
    singular: "Top-up",
    slug: "top-ups",
    lead: "In-game currency codes. They are redeemed inside the game or on the publisher's redeem page, for the region shown.",
    hasGameFacts: false,
    hasSystemRequirements: false,
  },
  {
    key: "software",
    label: "Software",
    singular: "Software",
    slug: "software",
    lead: "Licence keys for desktop software. Edition, licence length and the number of devices are stated on each product.",
    hasGameFacts: false,
    hasSystemRequirements: false,
  },
];

export interface PlatformDef {
  key: PlatformKey;
  label: string;
  slug: string;
  pc: boolean;
  account: string;
  redeem: string[];
}

export const PLATFORMS: PlatformDef[] = [
  {
    key: "steam",
    label: "Steam",
    slug: "steam",
    pc: true,
    account: "a Steam account",
    redeem: [
      "Open the Steam app and sign in.",
      "Choose Games in the top menu, then Activate a Product on Steam.",
      "Enter the key and follow the prompts. The product is added to your library.",
    ],
  },
  {
    key: "epic",
    label: "Epic Games Store",
    slug: "epic-games",
    pc: true,
    account: "an Epic Games account",
    redeem: [
      "Open the Epic Games Launcher and sign in.",
      "Select your profile icon, then Redeem Code.",
      "Enter the key and confirm. The product is added to your library.",
    ],
  },
  {
    key: "ea-app",
    label: "EA app",
    slug: "ea-app",
    pc: true,
    account: "an EA account",
    redeem: [
      "Open the EA app and sign in.",
      "Open the menu (three lines), then Redeem code.",
      "Enter the key and confirm. The product is added to your library.",
    ],
  },
  {
    key: "ubisoft-connect",
    label: "Ubisoft Connect",
    slug: "ubisoft-connect",
    pc: true,
    account: "a Ubisoft account",
    redeem: [
      "Open Ubisoft Connect on PC and sign in.",
      "Open the menu (three lines), then Activate a key.",
      "Enter the key and confirm. The product is added to your games.",
    ],
  },
  {
    key: "gog",
    label: "GOG",
    slug: "gog",
    pc: true,
    account: "a GOG account",
    redeem: [
      "Sign in at gog.com and go to gog.com/redeem, or open GOG Galaxy and choose Redeem GOG code from the menu.",
      "Enter the key and confirm.",
      "The product appears in your GOG library.",
    ],
  },
  {
    key: "battle-net",
    label: "Battle.net",
    slug: "battle-net",
    pc: true,
    account: "a Battle.net account",
    redeem: [
      "Open the Battle.net app and sign in.",
      "Select your account name, then Redeem a Code.",
      "Enter the key and confirm.",
    ],
  },
  {
    key: "xbox",
    label: "Xbox",
    slug: "xbox",
    pc: false,
    account: "a Microsoft account",
    redeem: [
      "Sign in at redeem.microsoft.com with your Microsoft account, or open the Microsoft Store on your Xbox and choose Redeem.",
      "Enter the 25-character code.",
      "Confirm. Content is added to the Microsoft account, balance to its wallet.",
    ],
  },
  {
    key: "playstation",
    label: "PlayStation",
    slug: "playstation",
    pc: false,
    account: "a PlayStation Network account",
    redeem: [
      "On your console, open PlayStation Store and choose Redeem Codes from the menu, or sign in on the PlayStation Store website and choose Redeem Codes under your avatar.",
      "Enter the 12-character code.",
      "Confirm. The content or balance is added to your account.",
    ],
  },
  {
    key: "nintendo",
    label: "Nintendo",
    slug: "nintendo",
    pc: false,
    account: "a Nintendo Account",
    redeem: [
      "Open Nintendo eShop on your console and select the user.",
      "Choose Enter Code from the menu on the left.",
      "Enter the 16-character code and confirm.",
    ],
  },
  {
    key: "rockstar",
    label: "Rockstar Games Launcher",
    slug: "rockstar",
    pc: true,
    account: "a Rockstar Games account",
    redeem: [
      "Open the Rockstar Games Launcher and sign in.",
      "Open the account menu, then Redeem Code.",
      "Enter the key and confirm.",
    ],
  },
  {
    key: "other",
    label: "Other platforms",
    slug: "other",
    pc: false,
    account: "an account with the service named in the activation notes",
    redeem: ["Follow the activation notes on the product page. They name the service and the page where the key is entered."],
  },
];

export interface RegionDef {
  key: RegionKey;
  label: string;
  short: string;
  note: string;
}

export const REGIONS: RegionDef[] = [
  { key: "global", label: "Global", short: "Global", note: "Can be activated from any country we sell to." },
  { key: "europe", label: "Europe", short: "EU", note: "Can only be activated on an account set to a European country." },
  { key: "uk", label: "United Kingdom", short: "UK", note: "Can only be activated on an account set to the United Kingdom." },
  { key: "us", label: "United States", short: "US", note: "Can only be activated on an account set to the United States." },
  { key: "north-america", label: "North America", short: "NA", note: "Can only be activated on an account set to the United States or Canada." },
];

export interface GenreDef {
  key: string;
  label: string;
}

export const GENRES: GenreDef[] = [
  { key: "action", label: "Action" },
  { key: "adventure", label: "Adventure" },
  { key: "rpg", label: "RPG" },
  { key: "shooter", label: "Shooter" },
  { key: "strategy", label: "Strategy" },
  { key: "simulation", label: "Simulation" },
  { key: "sports", label: "Sports" },
  { key: "racing", label: "Racing" },
  { key: "fighting", label: "Fighting" },
  { key: "horror", label: "Horror" },
  { key: "survival", label: "Survival" },
  { key: "open-world", label: "Open world" },
  { key: "puzzle", label: "Puzzle" },
  { key: "platformer", label: "Platformer" },
  { key: "story-rich", label: "Story rich" },
  { key: "mmo", label: "MMO" },
  { key: "co-op", label: "Co-op" },
  { key: "indie", label: "Indie" },
  { key: "casual", label: "Casual" },
  { key: "vr", label: "VR" },
];

const TYPE_BY_KEY = new Map(PRODUCT_TYPES.map((t) => [t.key, t]));
const TYPE_BY_SLUG = new Map(PRODUCT_TYPES.map((t) => [t.slug, t]));
const PLATFORM_BY_KEY = new Map(PLATFORMS.map((p) => [p.key, p]));
const PLATFORM_BY_SLUG = new Map(PLATFORMS.map((p) => [p.slug, p]));
const REGION_BY_KEY = new Map(REGIONS.map((r) => [r.key, r]));
const GENRE_BY_KEY = new Map(GENRES.map((g) => [g.key, g]));

export function productTypeDef(key: string | null | undefined): ProductTypeDef | null {
  return key ? TYPE_BY_KEY.get(key as ProductTypeKey) ?? null : null;
}

export function productTypeBySlug(slug: string | null | undefined): ProductTypeDef | null {
  return slug ? TYPE_BY_SLUG.get(slug) ?? null : null;
}

export function platformDef(key: string | null | undefined): PlatformDef | null {
  return key ? PLATFORM_BY_KEY.get(key as PlatformKey) ?? null : null;
}

export function redeemTitle(key: string | null | undefined): string {
  const def = platformDef(key);
  return def && def.key !== "other" ? `Redeem on ${def.label}` : "Redeem with the named service";
}

export function platformBySlug(slug: string | null | undefined): PlatformDef | null {
  return slug ? PLATFORM_BY_SLUG.get(slug) ?? null : null;
}

export function regionDef(key: string | null | undefined): RegionDef | null {
  return key ? REGION_BY_KEY.get(key as RegionKey) ?? null : null;
}

export function genreDef(key: string | null | undefined): GenreDef | null {
  return key ? GENRE_BY_KEY.get(key) ?? null : null;
}

export function categorySlugFor(type: ProductTypeKey, platform: PlatformKey): string {
  return `${productTypeDef(type)!.slug}-${platformDef(platform)!.slug}`;
}

export function showsSystemRequirements(type: string, platform: string): boolean {
  return Boolean(productTypeDef(type)?.hasSystemRequirements && platformDef(platform)?.pc);
}

export function showsGameFacts(type: string): boolean {
  return Boolean(productTypeDef(type)?.hasGameFacts);
}

export interface KeySummary {
  title?: string;
  productType: string;
  platform: string;
  region: string;
  edition: string | null;
  languages: string[];
  genres: string[];
  releaseYear: number | null;
  validity: string | null;
}

export function keySpecText(item: KeySummary | null | undefined): string | null {
  if (!item) return null;
  const parts = [platformDef(item.platform)?.label, regionDef(item.region)?.label, item.edition, item.validity].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
