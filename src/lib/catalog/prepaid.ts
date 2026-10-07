import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PLATFORMS } from "@/lib/keys/taxonomy";

const LIVE = Prisma.sql`p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0`;

export interface TimetableCell {
  slug: string;
  price: number;
}

export interface TimetableRow {
  key: string;
  service: string;
  platform: string;
  region: string;
  cells: Record<string, TimetableCell>;
}

export interface Timetable {
  columns: { key: string; label: string }[];
  rows: TimetableRow[];
}

function durationKey(validity: string | null, title: string): { key: string; label: string; order: number } | null {
  const source = (validity ?? title).toLowerCase();
  const m = /(\d+)\s*(day|days|month|months|year|years)\b/.exec(source);
  if (!m) return null;
  const n = Number(m[1]);
  if (m[2].startsWith("year")) return { key: `${n * 12}m`, label: n === 1 ? "12 months" : `${n * 12} months`, order: n * 12 };
  if (m[2].startsWith("month")) return { key: `${n}m`, label: n === 1 ? "1 month" : `${n} months`, order: n };
  return { key: `${n}d`, label: `${n} days`, order: n / 30 };
}

export function serviceName(title: string): string {
  return title
    .replace(/\((?:[^)]*)\)/g, "")
    .replace(/\b\d+\s*(?:day|days|month|months|year|years)\b/gi, "")
    .replace(/\b(?:EU|UK|US|USA|NA|EMEA|ROW|Global|Worldwide|Europe|North America|United Kingdom|United States)\b/gi, "")
    .replace(/\b(?:Subscription|PSN Card|Time Card|Membership)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+[-–—:]\s*$/, "")
    .trim();
}

export async function subscriptionTimetable(limit = 40): Promise<Timetable> {
  const rows = await prisma.$queryRaw<{ slug: string; title: string; validity: string | null; region: string; platform: string; price: number }[]>`
    SELECT p."slug", k."title", k."validity", k."region", k."platform", p."price"::float AS price
    FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
    WHERE ${LIVE} AND k."productType" = 'subscription'
    ORDER BY p."price" ASC`;
  const columns = new Map<string, { key: string; label: string; order: number }>();
  const byRow = new Map<string, TimetableRow>();
  for (const r of rows) {
    const d = durationKey(r.validity, r.title);
    if (!d) continue;
    columns.set(d.key, d);
    const service = serviceName(r.title);
    const key = `${service.toLowerCase()}|${r.region}`;
    const row = byRow.get(key) ?? { key, service, platform: r.platform, region: r.region, cells: {} };
    if (!row.cells[d.key]) row.cells[d.key] = { slug: r.slug, price: r.price };
    byRow.set(key, row);
  }
  const order = (p: string) => PLATFORMS.findIndex((x) => x.key === p);
  const regionOrder = ["global", "europe", "uk", "us", "north-america"];
  return {
    columns: [...columns.values()].sort((a, b) => a.order - b.order).map(({ key, label }) => ({ key, label })),
    rows: [...byRow.values()]
      .sort((a, b) => order(a.platform) - order(b.platform) || a.service.localeCompare(b.service, "en-GB") || regionOrder.indexOf(a.region) - regionOrder.indexOf(b.region))
      .slice(0, limit),
  };
}

export interface GiftCardGroup {
  key: string;
  platform: string;
  region: string;
  title: string;
  products: { id: string; slug: string; value: number | null; currency: string | null; price: number }[];
}

export async function giftCardGroups(): Promise<GiftCardGroup[]> {
  const rows = await prisma.$queryRaw<{ id: string; slug: string; title: string; platform: string; region: string; faceValue: number | null; faceCurrency: string | null; price: number }[]>`
    SELECT p."id", p."slug", k."title", k."platform", k."region", k."faceValue"::float AS "faceValue", k."faceCurrency", p."price"::float AS price
    FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
    WHERE ${LIVE} AND k."productType" = 'gift-card'
    ORDER BY k."faceValue" ASC NULLS LAST, p."price" ASC`;
  const groups = new Map<string, GiftCardGroup>();
  for (const r of rows) {
    const key = `${r.platform}|${r.region}`;
    const group = groups.get(key) ?? { key, platform: r.platform, region: r.region, title: r.title.replace(/\s*[€£$]\s?\d+(?:[.,]\d+)?.*$/, "").trim(), products: [] };
    if (!group.products.some((p) => p.value !== null && p.value === r.faceValue)) group.products.push({ id: r.id, slug: r.slug, value: r.faceValue, currency: r.faceCurrency, price: r.price });
    groups.set(key, group);
  }
  const order = (p: string) => PLATFORMS.findIndex((x) => x.key === p);
  return [...groups.values()].sort((a, b) => order(a.platform) - order(b.platform) || a.region.localeCompare(b.region));
}
