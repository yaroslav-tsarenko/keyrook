import type { CatalogProduct } from "@/components/product/product-face";

export interface HomeIndexEntry {
  key: string;
  slug: string;
  name: string;
  href: string;
  count: number;
  minPrice: number | null;
  lead?: string;
}

export interface HomePriceBand {
  key: string;
  min: number | null;
  max: number | null;
  total: number;
  products: CatalogProduct[];
}

export interface HomeData {
  totalProducts: number;
  hero: CatalogProduct | null;
  types: HomeIndexEntry[];
  platforms: HomeIndexEntry[];
  bands: HomePriceBand[];
  releases: CatalogProduct[];
  prepaid: CatalogProduct[];
  newest: CatalogProduct[];
  drops: CatalogProduct[];
}
