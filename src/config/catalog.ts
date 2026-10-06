import type { PlatformKey, ProductTypeKey, RegionKey } from "@/lib/keys/taxonomy";

export interface TypeQuota {
  type: ProductTypeKey;
  cap: number;
  platformShare?: number;
}

export interface CatalogConfig {
  target: { min: number; max: number };
  quotas: TypeQuota[];
  pricing: {
    margin: number;
    minMarginAbs: number;
    priceTolerance: number;
    orderPriceTolerance: number;
    minPrice: number;
    maxPriceByType: Record<ProductTypeKey, number>;
    bands: number[];
  };
  anomaly: {
    cohortPercentile: number;
    cohortMultiplier: number;
    cohortFloor: number;
    siblingMultiplier: number;
    minCohortSize: number;
    faceValueMin: number;
    faceValueMax: number;
  };
  include: {
    regions: RegionKey[];
    minTextQty: number;
    requireCover: boolean;
    requireEnglishName: boolean;
    allowPreorders: boolean;
  };
  exclude: {
    regionTerms: string[];
    titleTerms: string[];
    adultTerms: string[];
    gamblingTerms: string[];
    publishers: string[];
    languagesOnly: string[];
    platforms: string[];
  };
  selection: {
    keepExisting: boolean;
    maxPerTitle: number;
  };
  sync: {
    pageSize: number;
    concurrency: number;
    maxPages: number | null;
    chunkSize: number;
    refreshBatch: number;
  };
}

export const catalogConfig: CatalogConfig = {
  target: { min: 5000, max: 7000 },
  quotas: [
    { type: "game", cap: 3700, platformShare: 0.55 },
    { type: "dlc", cap: 1400, platformShare: 0.6 },
    { type: "subscription", cap: 140 },
    { type: "gift-card", cap: 320 },
    { type: "top-up", cap: 320 },
    { type: "software", cap: 240 },
  ],
  pricing: {
    margin: 0.12,
    minMarginAbs: 0.3,
    priceTolerance: 0.05,
    orderPriceTolerance: 0.02,
    minPrice: 0.49,
    maxPriceByType: {
      game: 150,
      dlc: 90,
      subscription: 180,
      "gift-card": 220,
      "top-up": 180,
      software: 260,
    },
    bands: [5, 15, 30, 60],
  },
  anomaly: {
    cohortPercentile: 0.95,
    cohortMultiplier: 1.6,
    cohortFloor: 30,
    siblingMultiplier: 4,
    minCohortSize: 15,
    faceValueMin: 0.6,
    faceValueMax: 1.35,
  },
  include: {
    regions: ["global", "europe", "uk", "us", "north-america"],
    minTextQty: 1,
    requireCover: true,
    requireEnglishName: true,
    allowPreorders: false,
  },
  exclude: {
    regionTerms: ["russia", "russian federation", "ru vpn", "ru/cis", "cis", "belarus", "iran", "north korea", "syria", "cuba", "crimea", "donetsk", "luhansk"],
    titleTerms: ["vpn", "ru/cis", "cis only", "russia only", "ru only", "ru language", "russian language only", "cis key", " ru key", "(ru)", "[ru]", "- ru", "russia", "belarus"],
    adultTerms: ["hentai", "nsfw", "adult only", "adults only", "18+", "nudity", "sexual content", "erotic", "porn", "xxx", "uncensored"],
    gamblingTerms: ["random", "mystery", "loot box", "lootbox", "surprise key", "casino", "slots", "gambling", "lucky box", "blind box", "mystery box"],
    publishers: ["kaspersky"],
    languagesOnly: ["Russian", "Belarusian", "Kazakh"],
    platforms: ["xbox 360", "playstation 3", "ps3", "android", "ios", "mog station"],
  },
  selection: {
    keepExisting: true,
    maxPerTitle: 4,
  },
  sync: {
    pageSize: 100,
    concurrency: 4,
    maxPages: null,
    chunkSize: 400,
    refreshBatch: 100,
  },
};

export function quotaTotal(): number {
  return catalogConfig.quotas.reduce((sum, q) => sum + q.cap, 0);
}

export type ProductFeedId = "google" | "facebook" | "generic";

export const PRODUCT_FEEDS: Record<ProductFeedId, { enabled: boolean; reason: string }> = {
  google: {
    enabled: false,
    reason: "Off: Google Shopping does not accept activation keys and other digital codes, and repeated disapprovals can suspend the Merchant Center account.",
  },
  facebook: {
    enabled: false,
    reason: "Off: Meta's commerce policies do not allow digital products in catalogues and shops.",
  },
  generic: {
    enabled: false,
    reason: "Off: no partner consumes this feed yet. Turn it on in src/config/catalog.ts when one does.",
  },
};

export const ANY_PRODUCT_FEED_ENABLED = Object.values(PRODUCT_FEEDS).some((feed) => feed.enabled);

export type { PlatformKey };
