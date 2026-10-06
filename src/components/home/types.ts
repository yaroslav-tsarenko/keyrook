import type { CatalogProduct } from "@/components/product/product-face";
import type { GiftCardGroup, Timetable } from "@/lib/catalog/prepaid";
import type { ReleaseWeek } from "@/components/catalog/ReleaseRuler";

export interface CoverRef {
  id: string;
  slug: string;
  title: string;
  image: string;
}

export interface HomePlatform {
  key: string;
  slug: string;
  name: string;
  short: string;
  tone: string;
  href: string;
  count: number;
  minPrice: number | null;
  rank: number;
  covers: CoverRef[];
}

export interface HomeGenre {
  key: string;
  label: string;
  href: string;
  count: number;
  covers: CoverRef[];
}

export interface HomeRelease {
  product: CatalogProduct;
  releaseDate: string;
}

export interface HomeBand {
  key: string;
  min: number | null;
  max: number | null;
  baseMin: number | null;
  baseMax: number | null;
  total: number;
  ids: string[];
}

export interface HomeType {
  key: string;
  name: string;
  href: string;
  count: number;
}

export interface HomeData {
  live: number;
  onSale: number;
  syncedAt: string | null;
  types: HomeType[];
  platforms: HomePlatform[];
  doorCovers: CoverRef[];
  ctaCovers: CoverRef[];
  deals: { total: number; feature: CatalogProduct | null; rail: CatalogProduct[] };
  genres: HomeGenre[];
  releases: { items: HomeRelease[]; weeks: ReleaseWeek[]; total: number; now: number };
  giftCards: GiftCardGroup[];
  timetable: Timetable;
  activationPlatforms: string[];
  bands: Record<string, HomeBand[]>;
  bandProducts: Record<string, CatalogProduct>;
}
