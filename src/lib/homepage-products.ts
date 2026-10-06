export interface HomepageProduct {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number | string;
  comparePrice?: number | string | null;
  quantity?: number;
  isFeatured?: boolean;
  shortDescription?: string | null;
  createdAt?: string | Date;
  isNew?: boolean;
  images: { url: string; alt?: string | null }[];
  categories?: { category: { name: string; slug: string } }[];
}

export interface HomepageCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  children?: { slug: string }[];
}

export const NEW_PRODUCT_WINDOW_DAYS = 30;
export const ORDER_RANKING_WINDOW_DAYS = 30;

function time(value?: string | Date): number {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

export function isInStock(product: HomepageProduct): boolean {
  return product.quantity === undefined || product.quantity > 0;
}

export function hasImage(product: HomepageProduct): boolean {
  return Boolean(product.images?.[0]?.url);
}

export function subtreeSlugs(category: HomepageCategory): string[] {
  return [category.slug, ...(category.children ?? []).map((c) => c.slug)];
}

export function inSlugs(product: HomepageProduct, slugs: string[]): boolean {
  return Boolean(product.categories?.some((c) => slugs.includes(c.category.slug)));
}

export function getProductsByCategory(products: HomepageProduct[], category: HomepageCategory): HomepageProduct[] {
  const slugs = subtreeSlugs(category);
  return products.filter((p) => inSlugs(p, slugs));
}

export function preferSubcategories(products: HomepageProduct[], preferred: string[]): HomepageProduct[] {
  if (preferred.length === 0) return products;
  const rank = (p: HomepageProduct) => {
    const hits = (p.categories ?? []).map((c) => preferred.indexOf(c.category.slug)).filter((i) => i >= 0);
    return hits.length ? Math.min(...hits) : preferred.length;
  };
  return products
    .map((p, i) => ({ p, i, r: rank(p) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.p);
}

export function getDiscountPercent(product: HomepageProduct): number {
  const price = Number(product.price);
  const compare = product.comparePrice ? Number(product.comparePrice) : null;
  if (!compare || compare <= price) return 0;
  return Math.floor(((compare - price) / compare) * 100);
}

export function getSaleProducts(products: HomepageProduct[], limit: number): HomepageProduct[] {
  return products
    .filter((p) => getDiscountPercent(p) > 0)
    .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
    .slice(0, limit);
}

export function getNewProducts(products: HomepageProduct[], limit: number): HomepageProduct[] {
  return [...products].sort((a, b) => time(b.createdAt) - time(a.createdAt)).slice(0, limit);
}

export function getFeaturedProducts(products: HomepageProduct[], limit: number): HomepageProduct[] {
  return products.filter((p) => p.isFeatured).slice(0, limit);
}

export function rankByOrders(products: HomepageProduct[], unitsSold: Map<string, number>, limit: number): HomepageProduct[] {
  return products
    .filter((p) => (unitsSold.get(p.id) ?? 0) > 0)
    .sort((a, b) => (unitsSold.get(b.id) ?? 0) - (unitsSold.get(a.id) ?? 0))
    .slice(0, limit);
}

export function featuredFirst(products: HomepageProduct[]): HomepageProduct[] {
  return [...products].sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
}
