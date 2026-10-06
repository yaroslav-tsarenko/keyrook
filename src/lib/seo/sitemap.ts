import { prisma } from "@/lib/prisma";
import { STORE_POLICY } from "@/config/store-policy";
import { POLICY_SLUGS, policyHref } from "@/components/layout/PolicyLayout/policies";
import { categoryCounts, getCategoryTree } from "@/components/catalog/catalog-query";
import { absoluteUrl, publicImageUrls } from "./url";

export const SITEMAP_PRODUCTS_PER_FILE = 5000;
export const SITEMAP_CACHE_SECONDS = 3600;

export interface SitemapEntry {
  loc: string;
  lastmod?: Date | null;
  images?: string[];
}

export function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function isoDate(date: Date): string {
  return date.toISOString();
}

export function urlsetXml(entries: SitemapEntry[]): string {
  const withImages = entries.some((e) => e.images?.length);
  const body = entries
    .map((entry) => {
      const parts = [`<loc>${xmlEscape(entry.loc)}</loc>`];
      if (entry.lastmod) parts.push(`<lastmod>${isoDate(entry.lastmod)}</lastmod>`);
      for (const image of (entry.images ?? []).slice(0, 1000)) parts.push(`<image:image><image:loc>${xmlEscape(image)}</image:loc></image:image>`);
      return `<url>${parts.join("")}</url>`;
    })
    .join("\n");
  const ns = `xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${withImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ""}`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset ${ns}>\n${body}\n</urlset>\n`;
}

export function sitemapIndexXml(entries: SitemapEntry[]): string {
  const body = entries
    .map((entry) => `<sitemap><loc>${xmlEscape(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${isoDate(entry.lastmod)}</lastmod>` : ""}</sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`;
}

export function xmlResponse(xml: string, cacheSeconds = SITEMAP_CACHE_SECONDS): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds}`,
      "X-Robots-Tag": "noindex",
    },
  });
}

const ACTIVE_PRODUCT = { status: "ACTIVE" as const };

async function latestProductUpdate(): Promise<Date | null> {
  const latest = await prisma.product.aggregate({ where: ACTIVE_PRODUCT, _max: { updatedAt: true } });
  return latest._max.updatedAt ?? null;
}

function maxDate(...dates: (Date | null | undefined)[]): Date | null {
  const valid = dates.filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime()));
  return valid.length ? new Date(Math.max(...valid.map((d) => d.getTime()))) : null;
}

export async function staticPageEntries(): Promise<SitemapEntry[]> {
  const [latest, pages] = await Promise.all([
    latestProductUpdate(),
    prisma.page.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true }, orderBy: { slug: "asc" } }),
  ]);
  const policiesUpdated = new Date(`${STORE_POLICY.policiesLastUpdated}T00:00:00Z`);
  return [
    { loc: absoluteUrl("/"), lastmod: latest },
    { loc: absoluteUrl("/catalog"), lastmod: latest },
    { loc: absoluteUrl("/about") },
    { loc: absoluteUrl("/contact") },
    { loc: absoluteUrl("/faq") },
    { loc: absoluteUrl("/policies"), lastmod: policiesUpdated },
    ...POLICY_SLUGS.map((slug) => ({ loc: absoluteUrl(policyHref(slug)), lastmod: policiesUpdated })),
    ...pages.map((page) => ({ loc: absoluteUrl(`/pages/${page.slug}`), lastmod: page.updatedAt })),
  ];
}

export async function categoryEntries(): Promise<SitemapEntry[]> {
  const tree = await getCategoryTree();
  const [counts, meta, links] = await Promise.all([
    categoryCounts(tree),
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, updatedAt: true } }),
    prisma.productCategory.findMany({ where: { product: ACTIVE_PRODUCT }, select: { categoryId: true, product: { select: { updatedAt: true } } } }),
  ]);
  const updatedById = new Map(meta.map((c) => [c.id, c.updatedAt]));
  const latestByCategory = new Map<string, Date>();
  for (const link of links) {
    const current = latestByCategory.get(link.categoryId);
    if (!current || link.product.updatedAt > current) latestByCategory.set(link.categoryId, link.product.updatedAt);
  }
  const depth = (id: string): number => {
    const c = tree.byId.get(id);
    return c?.parentId ? 1 + depth(c.parentId) : 0;
  };
  return tree.all
    .filter((c) => (counts.get(c.id) ?? 0) > 0)
    .sort((a, b) => depth(a.id) - depth(b.id) || a.sortOrder - b.sortOrder)
    .map((c) => {
      const subtreeLatest = maxDate(...tree.subtreeIds(c.id).map((id) => latestByCategory.get(id)));
      const art = tree.uniqueArt(c);
      return {
        loc: absoluteUrl(`/catalog/${c.slug}`),
        lastmod: maxDate(updatedById.get(c.id), subtreeLatest),
        images: art ? publicImageUrls([art]) : [],
      };
    });
}

export async function productSitemapCount(): Promise<number> {
  const total = await prisma.product.count({ where: ACTIVE_PRODUCT });
  return Math.max(1, Math.ceil(total / SITEMAP_PRODUCTS_PER_FILE));
}

export async function productEntries(chunk: number): Promise<SitemapEntry[]> {
  const products = await prisma.product.findMany({
    where: ACTIVE_PRODUCT,
    select: { slug: true, updatedAt: true, images: { orderBy: { sortOrder: "asc" }, select: { url: true } } },
    orderBy: { id: "asc" },
    skip: chunk * SITEMAP_PRODUCTS_PER_FILE,
    take: SITEMAP_PRODUCTS_PER_FILE,
  });
  return products.map((p) => ({
    loc: absoluteUrl(`/product/${p.slug}`),
    lastmod: p.updatedAt,
    images: publicImageUrls(p.images.map((i) => i.url)),
  }));
}

export async function sitemapIndexEntries(): Promise<SitemapEntry[]> {
  const [chunks, latest, categoryLatest] = await Promise.all([
    productSitemapCount(),
    latestProductUpdate(),
    prisma.category.aggregate({ where: { isActive: true }, _max: { updatedAt: true } }),
  ]);
  return [
    { loc: absoluteUrl("/sitemaps/pages.xml"), lastmod: maxDate(latest, new Date(`${STORE_POLICY.policiesLastUpdated}T00:00:00Z`)) },
    { loc: absoluteUrl("/sitemaps/categories.xml"), lastmod: maxDate(latest, categoryLatest._max.updatedAt) },
    ...Array.from({ length: chunks }, (_, i) => ({ loc: absoluteUrl(`/sitemaps/products-${i + 1}.xml`), lastmod: latest })),
  ];
}
