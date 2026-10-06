import { createHash } from "node:crypto";
import { catalogConfig, type CatalogConfig } from "@/config/catalog";
import { rarityFromColor, type ExteriorCode, type RarityKey, type WeaponTypeKey } from "@/lib/skins/cs2";
import { floatBand, parseMarketHashName } from "./parse";
import { computeSellPrice, round2 } from "./pricing";
import { sihImageUrl } from "./image";
import type { SihOffer } from "./types";

export interface OfferMeta {
  offerId: string | null;
  float: number | null;
  paintSeed: number | null;
  paintIndex: number | null;
  inspect: string | null;
  market: string | null;
}

export interface Candidate {
  marketHashName: string;
  weapon: string;
  weaponType: WeaponTypeKey;
  skinName: string | null;
  exterior: ExteriorCode | null;
  isStatTrak: boolean;
  isSouvenir: boolean;
  rarity: RarityKey;
  rarityColor: string | null;
  cost: number;
  sell: number;
  steamPrice: number | null;
  count: number;
  offers: number;
  phase: string | null;
  collection: string | null;
  imageHash: string | null;
  imageUrl: string;
  floatMin: number | null;
  floatMax: number | null;
  offer: OfferMeta;
}

export interface PricingInput {
  margin: number;
  minMarginAbs: number;
}

export interface CandidateStats {
  offers: number;
  names: number;
  duplicates: number;
  eligible: number;
  rejected: Record<string, number>;
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeColor(color: string | null | undefined): string | null {
  if (!color) return null;
  const hex = color.replace(/^#/, "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(hex) ? `#${hex}` : null;
}

export function stableHash(value: string): string {
  return createHash("sha1").update(value).digest("hex");
}

export function buildCandidates(
  offers: SihOffer[],
  pricing: PricingInput,
  config: CatalogConfig = catalogConfig,
): { candidates: Candidate[]; stats: CandidateStats } {
  const rejected: Record<string, number> = {};
  const reject = (reason: string) => {
    rejected[reason] = (rejected[reason] ?? 0) + 1;
  };
  const byName = new Map<string, SihOffer[]>();
  for (const offer of offers) {
    const list = byName.get(offer.marketHashName) ?? [];
    list.push(offer);
    byName.set(offer.marketHashName, list);
  }

  const candidates: Candidate[] = [];
  for (const [marketHashName, group] of byName) {
    const parsed = parseMarketHashName(marketHashName);
    if (!parsed.weapon || !parsed.weaponType) {
      reject("not_weapon");
      continue;
    }
    if (!config.quotas.some((q) => q.type === parsed.weaponType)) {
      reject("type_excluded");
      continue;
    }
    if (parsed.isStatTrak && !config.include.statTrak) {
      reject("stattrak_excluded");
      continue;
    }
    if (parsed.isSouvenir && !config.include.souvenir) {
      reject("souvenir_excluded");
      continue;
    }
    if (!parsed.exterior && !(parsed.isStar && !parsed.skinName && config.include.vanillaStar)) {
      reject("no_exterior");
      continue;
    }

    const acceptable = group.filter(({ item }) => item.price > 0 && (item.count ?? 0) >= config.include.minStock && sihImageUrl(item.image, config.images.size));
    if (acceptable.length === 0) {
      reject("no_acceptable_offer");
      continue;
    }
    acceptable.sort((a, b) => {
      if (a.item.price !== b.item.price) return a.item.price - b.item.price;
      const fa = finite(a.item.float) ?? 2;
      const fb = finite(b.item.float) ?? 2;
      return fa - fb;
    });
    const best = acceptable[0].item;

    const rarity: RarityKey | null = parsed.isStar ? "extraordinary" : rarityFromColor(best.color);
    if (!rarity) {
      reject("unknown_rarity");
      continue;
    }

    const cost = round2(best.price);
    const sell = computeSellPrice(cost, pricing);
    if (sell < config.pricing.minPrice || sell > config.pricing.maxPrice) {
      reject("price_out_of_range");
      continue;
    }
    const steamPrice = finite(best.steam);
    if (steamPrice && steamPrice > 0 && cost > steamPrice * config.pricing.maxCostOverReference) {
      reject("price_anomaly");
      continue;
    }

    const phases = new Set(acceptable.map(({ item }) => item.phase?.trim() || null));
    const phase = phases.size === 1 ? [...phases][0] : null;
    const band = floatBand(parsed.exterior, finite(best.floatMin), finite(best.floatMax));
    const imageUrl = sihImageUrl(best.image, config.images.size)!;

    candidates.push({
      marketHashName,
      weapon: parsed.weapon,
      weaponType: parsed.weaponType,
      skinName: parsed.skinName,
      exterior: parsed.exterior,
      isStatTrak: parsed.isStatTrak,
      isSouvenir: parsed.isSouvenir,
      rarity,
      rarityColor: normalizeColor(best.color),
      cost,
      sell,
      steamPrice: steamPrice ? round2(steamPrice) : null,
      count: acceptable.reduce((sum, { item }) => sum + (item.count ?? 0), 0),
      offers: acceptable.length,
      phase,
      collection: acceptable.map(({ item }) => item.collection?.trim()).find(Boolean) ?? null,
      imageHash: best.image ?? null,
      imageUrl,
      floatMin: band?.floatMin ?? null,
      floatMax: band?.floatMax ?? null,
      offer: {
        offerId: best.id != null ? String(best.id) : null,
        float: finite(best.float),
        paintSeed: finite(best.paintSeed),
        paintIndex: finite(best.paintIndex),
        inspect: best.inspect ?? null,
        market: best.market ?? null,
      },
    });
  }

  return {
    candidates,
    stats: {
      offers: offers.length,
      names: byName.size,
      duplicates: offers.length - byName.size,
      eligible: candidates.length,
      rejected,
    },
  };
}

export function priceBand(price: number, bands: number[] = catalogConfig.pricing.bands): number {
  const index = bands.findIndex((limit) => price < limit);
  return index === -1 ? bands.length : index;
}

function interleave<T>(queues: T[][]): T[] {
  const out: T[] = [];
  const cursors = queues.map(() => 0);
  let remaining = queues.reduce((sum, q) => sum + q.length, 0);
  while (remaining > 0) {
    for (let i = 0; i < queues.length; i++) {
      if (cursors[i] < queues[i].length) {
        out.push(queues[i][cursors[i]++]);
        remaining--;
      }
    }
  }
  return out;
}

export function selectCatalog(
  candidates: Candidate[],
  existing: Set<string> = new Set(),
  config: CatalogConfig = catalogConfig,
): Candidate[] {
  const priority = (c: Candidate) => `${config.selection.keepExisting && existing.has(c.marketHashName) ? "0" : "1"}${stableHash(c.marketHashName)}`;
  const selected: Candidate[] = [];

  for (const quota of config.quotas) {
    const pool = candidates.filter((c) => c.weaponType === quota.type);
    const byWeapon = new Map<string, Candidate[]>();
    for (const c of pool) {
      const list = byWeapon.get(c.weapon) ?? [];
      list.push(c);
      byWeapon.set(c.weapon, list);
    }

    const weaponQueues = [...byWeapon.keys()].sort().map((weapon) => {
      const buckets = new Map<string, Candidate[]>();
      for (const c of byWeapon.get(weapon)!) {
        const key = [c.rarity, c.exterior ?? "-", priceBand(c.sell, config.pricing.bands), c.isStatTrak ? "st" : c.isSouvenir ? "sv" : "n"].join("|");
        const list = buckets.get(key) ?? [];
        list.push(c);
        buckets.set(key, list);
      }
      const ordered = [...buckets.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, list]) => list.sort((a, b) => priority(a).localeCompare(priority(b))));
      const perSkin = new Map<string, number>();
      return interleave(ordered).filter((c) => {
        const key = `${c.weapon}|${c.skinName ?? ""}`;
        const n = (perSkin.get(key) ?? 0) + 1;
        perSkin.set(key, n);
        return n <= config.selection.maxVariantsPerSkin;
      });
    });

    selected.push(...interleave(weaponQueues).slice(0, quota.cap));
  }

  return selected.slice(0, config.target.max);
}
