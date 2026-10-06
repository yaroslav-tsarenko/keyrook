export interface PriceBand {
  key: string;
  min: number | null;
  max: number | null;
}

export const PRICE_BANDS: PriceBand[] = [
  { key: "under-5", min: null, max: 5 },
  { key: "5-15", min: 5, max: 15 },
  { key: "15-40", min: 15, max: 40 },
  { key: "40-up", min: 40, max: null },
];

export const MERCH = {
  bandItems: 9,
  bandMinimum: 3,
  newest: 8,
  releases: 8,
  prepaid: 8,
  related: 4,
  recentlyViewed: 8,
} as const;
