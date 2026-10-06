export interface PriceBand {
  key: string;
  min: number | null;
  max: number | null;
}

export const PRICE_BANDS: PriceBand[] = [
  { key: "under-10", min: null, max: 10 },
  { key: "under-25", min: 10, max: 25 },
  { key: "25-250", min: 25, max: 250 },
  { key: "250-up", min: 250, max: null },
];

export const MERCH = {
  bandItems: 9,
  bandMinimum: 3,
  newest: 8,
  spotlightKnives: 3,
  spotlightGloves: 2,
  stattrak: 3,
  souvenir: 2,
  related: 4,
  siblings: 12,
  pairsTolerance: 0.4,
  recentlyViewed: 8,
} as const;
