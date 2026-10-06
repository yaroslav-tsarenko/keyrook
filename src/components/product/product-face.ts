import { platformDef, productTypeDef, regionDef, type KeySummary } from "@/lib/keys/taxonomy";

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number | string;
  comparePrice?: number | string | null;
  quantity?: number;
  images?: { url: string; alt?: string | null }[];
  imageUrl?: string | null;
  category?: string | null;
  createdAt?: string | Date | null;
  isNew?: boolean;
  key?: KeySummary | null;
}

export interface ProductFace {
  title: string;
  typeLabel: string | null;
  platform: string | null;
  platformKey: string | null;
  region: string | null;
  regionShort: string | null;
  regionLocked: boolean;
  detail: string | null;
}

export function productFace(name: string, key: KeySummary | null | undefined): ProductFace {
  if (!key) return { title: name, typeLabel: null, platform: null, platformKey: null, region: null, regionShort: null, regionLocked: false, detail: null };
  const platform = platformDef(key.platform);
  const region = regionDef(key.region);
  return {
    title: key.title || name,
    typeLabel: productTypeDef(key.productType)?.singular ?? null,
    platform: platform?.label ?? null,
    platformKey: platform?.key ?? null,
    region: region?.label ?? null,
    regionShort: region?.short ?? null,
    regionLocked: key.region !== "global",
    detail: [key.edition, key.validity, key.releaseYear ? String(key.releaseYear) : null].filter(Boolean).slice(0, 2).join(" · ") || null,
  };
}
