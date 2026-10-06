import type { SkinProduct } from "@/components/skin/SkinTray";
import type { RaritySlug } from "@/lib/skins/cs2";

export interface HomeWeaponType {
  key: string;
  name: string;
  count: number;
  minPrice: number | null;
  render: SkinProduct | null;
}

export interface HomeRarityTier {
  slug: RaritySlug;
  label: string;
  keys: string[];
  count: number;
  product: SkinProduct | null;
}

export interface HomePriceBand {
  key: string;
  min: number | null;
  max: number | null;
  total: number;
  products: SkinProduct[];
}

export interface HomeData {
  totalProducts: number;
  hero: SkinProduct | null;
  types: HomeWeaponType[];
  knives: SkinProduct[];
  gloves: SkinProduct[];
  bands: HomePriceBand[];
  rarities: HomeRarityTier[];
  wear: { code: string; product: SkinProduct | null }[];
  wearSkin: string | null;
  stattrak: { count: number; products: SkinProduct[] };
  souvenir: { count: number; products: SkinProduct[] };
  newest: SkinProduct[];
  drops: SkinProduct[];
}
