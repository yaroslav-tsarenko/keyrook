export interface PriceBand {
  key: string;
  min: number | null;
  max: number | null;
}

export const PRICE_BAND_EDGES = [5, 10, 20, 40] as const;

export const PRICE_BANDS: PriceBand[] = [
  { key: "under-5", min: null, max: 5 },
  { key: "5-10", min: 5, max: 10 },
  { key: "10-20", min: 10, max: 20 },
  { key: "20-40", min: 20, max: 40 },
  { key: "40-up", min: 40, max: null },
];

export const MERCH = {
  bandItems: 8,
  bandMinimum: 4,
  newest: 8,
  releases: 16,
  releaseWindowDays: 56,
  releaseMinimum: 4,
  prepaid: 8,
  related: 4,
  recentlyViewed: 8,
  doorCovers: 12,
  ctaCovers: 6,
  lockerCovers: 3,
  dealRail: 10,
  dealMinimum: 4,
  genres: 18,
  genrePeek: 3,
  giftCardPlatforms: 4,
  timetableRows: 8,
  homePoolPerPlatform: 600,
} as const;
