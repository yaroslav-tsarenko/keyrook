import { catalogConfig, type CatalogConfig } from "@/config/catalog";
import type { ProductTypeKey } from "@/lib/keys/taxonomy";
import { normalizeKey, stableHash, type Classified, type RejectReason } from "./classify";
import { computeSellPrice } from "./pricing";

export type LiteItem = Pick<Classified, "esaId" | "dedupeKey" | "title" | "displayName" | "productType" | "platform" | "releaseYear" | "genres" | "cost" | "qty" | "faceValue" | "faceCurrency"> & {
  hasCover: boolean;
  hasDescription: boolean;
};

export function liteOf(item: Classified): LiteItem {
  return {
    esaId: item.esaId,
    dedupeKey: item.dedupeKey,
    title: item.title,
    displayName: item.displayName,
    productType: item.productType,
    platform: item.platform,
    releaseYear: item.releaseYear,
    genres: item.genres.slice(0, 1),
    cost: item.cost,
    qty: item.qty,
    faceValue: item.faceValue,
    faceCurrency: item.faceCurrency,
    hasCover: Boolean(item.cover),
    hasDescription: Boolean(item.description),
  };
}

export interface Candidate extends LiteItem {
  sell: number;
  alternates: { esaId: number; cost: number }[];
  descriptionFrom: number | null;
}

export type ClassifyStats = { products: number; rejected: Partial<Record<RejectReason, number>> };

export interface CandidateStats {
  products: number;
  classified: number;
  groups: number;
  duplicates: number;
  eligible: number;
  rejected: Partial<Record<RejectReason | "price_out_of_range" | "price_anomaly" | "face_value_anomaly", number>>;
}

const FACE_TO_EUR: Record<string, number> = { EUR: 1, USD: 0.86, GBP: 1.16 };

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))];
}

export function buildCandidates(
  items: Iterable<LiteItem>,
  classification: ClassifyStats,
  pricing: { margin: number; minMarginAbs: number },
  config: CatalogConfig = catalogConfig,
): { candidates: Candidate[]; stats: CandidateStats } {
  const rejected: CandidateStats["rejected"] = { ...classification.rejected };
  const reject = (reason: keyof CandidateStats["rejected"]) => {
    rejected[reason] = (rejected[reason] ?? 0) + 1;
  };

  const groups = new Map<string, LiteItem[]>();
  let classified = 0;
  for (const item of items) {
    classified++;
    const list = groups.get(item.dedupeKey) ?? [];
    list.push(item);
    groups.set(item.dedupeKey, list);
  }

  const capsRatio = (value: string) => {
    const letters = value.replace(/[^A-Za-z]/g, "");
    return letters.length ? letters.replace(/[^A-Z]/g, "").length / letters.length : 0;
  };
  const picked: Candidate[] = [];
  for (const list of groups.values()) {
    list.sort((a, b) => a.cost - b.cost || b.qty - a.qty || a.esaId - b.esaId);
    const named = [...list].sort((a, b) => capsRatio(a.title) - capsRatio(b.title))[0];
    picked.push({
      ...list[0],
      title: named.title,
      displayName: named.displayName,
      descriptionFrom: list[0].hasDescription || !named.hasDescription ? null : named.esaId,
      sell: computeSellPrice(list[0].cost, pricing),
      alternates: list.slice(1).map((c) => ({ esaId: c.esaId, cost: c.cost })),
    });
  }

  const cohorts = new Map<string, number[]>();
  const cohortKey = (c: Candidate) => `${c.productType}|${c.releaseYear ? Math.min(Math.floor((new Date().getUTCFullYear() - c.releaseYear) / 2), 6) : "x"}`;
  for (const c of picked) {
    if (c.productType !== "game" && c.productType !== "dlc") continue;
    const list = cohorts.get(cohortKey(c)) ?? [];
    list.push(c.cost);
    cohorts.set(cohortKey(c), list);
  }
  const cohortCeiling = new Map(
    [...cohorts.entries()].filter(([, v]) => v.length >= config.anomaly.minCohortSize).map(([k, v]) => [k, Math.max(config.anomaly.cohortFloor, percentile(v, config.anomaly.cohortPercentile) * config.anomaly.cohortMultiplier)]),
  );
  const siblings = new Map<string, number[]>();
  for (const c of picked) {
    const key = `${c.productType}|${normalizeKey(c.title)}`;
    const list = siblings.get(key) ?? [];
    list.push(c.cost);
    siblings.set(key, list);
  }

  const candidates: Candidate[] = [];
  for (const c of picked) {
    if (c.sell < config.pricing.minPrice || c.sell > config.pricing.maxPriceByType[c.productType]) {
      reject("price_out_of_range");
      continue;
    }
    const ceiling = cohortCeiling.get(cohortKey(c));
    const others = (siblings.get(`${c.productType}|${normalizeKey(c.title)}`) ?? []).filter((v) => v !== c.cost);
    const siblingMedian = others.length ? median(others) : null;
    if ((ceiling !== undefined && c.cost > ceiling) || (siblingMedian !== null && c.cost > config.anomaly.cohortFloor && c.cost > siblingMedian * config.anomaly.siblingMultiplier)) {
      reject("price_anomaly");
      continue;
    }
    if (c.faceValue && c.faceCurrency) {
      const faceEur = c.faceValue * (FACE_TO_EUR[c.faceCurrency] ?? 1);
      if (c.cost < faceEur * config.anomaly.faceValueMin || c.cost > faceEur * config.anomaly.faceValueMax) {
        reject("face_value_anomaly");
        continue;
      }
    }
    candidates.push(c);
  }

  return {
    candidates,
    stats: {
      products: classification.products,
      classified,
      groups: groups.size,
      duplicates: classified - groups.size,
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

function bucketed(pool: Candidate[], keyOf: (c: Candidate) => string, priority: (c: Candidate) => string): Candidate[] {
  const buckets = new Map<string, Candidate[]>();
  for (const c of pool) {
    const key = keyOf(c);
    const list = buckets.get(key) ?? [];
    list.push(c);
    buckets.set(key, list);
  }
  return interleave(
    [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, list]) => list.sort((a, b) => priority(a).localeCompare(priority(b)))),
  );
}

export function selectCatalog(candidates: Candidate[], existing: Set<string> = new Set(), config: CatalogConfig = catalogConfig): Candidate[] {
  const priority = (c: Candidate) =>
    `${config.selection.keepExisting && existing.has(c.dedupeKey) ? "0" : "1"}${c.hasCover ? "0" : "1"}${String(9 - Math.min(9, Math.floor(Math.log10(c.qty + 1) * 3))).padStart(1, "0")}${stableHash(c.dedupeKey)}`;
  const titleKey = (c: Candidate) => `${c.productType}|${normalizeKey(c.title)}`;
  const selected: Candidate[] = [];
  const chosen = new Set<string>();
  const perTitle = new Map<string, number>();
  const take = (c: Candidate) => {
    const key = titleKey(c);
    const n = perTitle.get(key) ?? 0;
    if (n >= config.selection.maxPerTitle) return false;
    perTitle.set(key, n + 1);
    selected.push(c);
    return true;
  };

  for (const quota of config.quotas) {
    const pool = candidates.filter((c) => c.productType === (quota.type as ProductTypeKey));
    const byPlatform = new Map<string, Candidate[]>();
    for (const c of pool) {
      const list = byPlatform.get(c.platform) ?? [];
      list.push(c);
      byPlatform.set(c.platform, list);
    }
    const genreKey = (c: Candidate) => `${c.genres[0] ?? "-"}|${priceBand(c.sell, config.pricing.bands)}`;
    const queues = [...byPlatform.keys()].sort().map((platform) => bucketed(byPlatform.get(platform)!, genreKey, priority));
    const platformCap = quota.platformShare ? Math.ceil(quota.cap * quota.platformShare) : quota.cap;
    const perPlatform = new Map<string, number>();
    let count = 0;

    for (const c of interleave(queues)) {
      if (count >= quota.cap) break;
      const used = perPlatform.get(c.platform) ?? 0;
      if (used >= platformCap) continue;
      if (!take(c)) continue;
      chosen.add(c.dedupeKey);
      perPlatform.set(c.platform, used + 1);
      count++;
    }
    if (count < quota.cap) {
      for (const c of interleave(queues)) {
        if (count >= quota.cap) break;
        if (chosen.has(c.dedupeKey)) continue;
        if (!take(c)) continue;
        chosen.add(c.dedupeKey);
        count++;
      }
    }
  }

  const limit = Math.min(config.target.max, config.quotas.reduce((sum, q) => sum + q.cap, 0));
  if (selected.length < limit && config.selection.spillover.length) {
    const spill = config.selection.spillover.map((type) => bucketed(candidates.filter((c) => c.productType === type && !chosen.has(c.dedupeKey)), (c) => c.platform, priority));
    for (const c of interleave(spill)) {
      if (selected.length >= limit) break;
      if (take(c)) chosen.add(c.dedupeKey);
    }
  }

  return selected.slice(0, config.target.max);
}
