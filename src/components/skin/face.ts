import { exteriorDef, isStarType, raritySlug, rarityDef, weaponTypeDef, type SkinSummary } from "@/lib/skins/cs2";

export interface SkinProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number | string;
  comparePrice?: number | string | null;
  quantity?: number;
  images?: { url: string; alt?: string | null }[];
  imageUrl?: string | null;
  categories?: { category: { name: string; slug?: string } }[];
  category?: string | null;
  createdAt?: string | Date | null;
  isNew?: boolean;
  skin?: SkinSummary | null;
}

export interface SkinFace {
  weaponLine: string;
  name: string;
  star: boolean;
  rarity: string | undefined;
  rarityLabel: string | null;
  exteriorCode: string | null;
  exteriorLabel: string;
  stattrak: boolean;
  souvenir: boolean;
  phase: string | null;
}

export function skinFace(name: string, skin: SkinSummary | null | undefined, fallbackLine?: string | null): SkinFace {
  if (!skin) {
    return { weaponLine: fallbackLine ?? "", name, star: false, rarity: undefined, rarityLabel: null, exteriorCode: null, exteriorLabel: "", stattrak: false, souvenir: false, phase: null };
  }
  const star = isStarType(skin.weaponType);
  const ext = exteriorDef(skin.exterior);
  const typeDef = weaponTypeDef(skin.weaponType);
  return {
    weaponLine: skin.skinName ? skin.weapon : typeDef?.singular ?? skin.weapon,
    name: skin.skinName ?? skin.weapon,
    star,
    rarity: raritySlug(skin.rarity),
    rarityLabel: rarityDef(skin.rarity)?.label ?? null,
    exteriorCode: ext?.code ?? null,
    exteriorLabel: ext?.label ?? "Not painted",
    stattrak: skin.isStatTrak,
    souvenir: skin.isSouvenir,
    phase: skin.phase,
  };
}
