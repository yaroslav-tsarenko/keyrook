import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo/metadata";
import { publicBrand } from "@/lib/utils/supplier";
import { clampText } from "@/lib/utils/sanitize-html";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductBuyBox, type KeyFact } from "@/components/product/ProductBuyBox";
import { ProductDetailTabs, type DetailRow, type RequirementBlock } from "@/components/product/ProductDetailTabs";
import { productJsonLd } from "@/components/product/product-structured-data";
import { ProductRail } from "@/components/home/ProductRail";
import { RecentlyViewed, RecordView } from "@/components/product/RecentlyViewed";
import { KEY_SELECT, getCategoryTree, keySummary, loadKeyProducts } from "@/components/catalog/catalog-query";
import { categorySlugFor, genreDef, platformDef, productTypeDef, redeemTitle, regionDef, showsGameFacts, showsSystemRequirements, type PlatformKey, type ProductTypeKey } from "@/lib/keys/taxonomy";
import { MERCH } from "@/config/merchandising";

export const revalidate = 60;

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

const getProduct = cache(async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      description: true,
      shortDescription: true,
      price: true,
      comparePrice: true,
      quantity: true,
      trackInventory: true,
      metaTitle: true,
      metaDescription: true,
      status: true,
      brand: true,
      condition: true,
      createdAt: true,
      item: { select: { ...KEY_SELECT, regionNote: true, releaseDate: true, developers: true, publishers: true, ageRating: true, systemRequirements: true, activationNotes: true, metacriticScore: true, videoId: true, faceValue: true, faceCurrency: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true } },
      categories: { select: { category: { select: { id: true, name: true, slug: true, parentId: true, isActive: true } } } },
    },
  });
  if (!product || product.status !== "ACTIVE" || !product.item) return null;
  return { ...product, item: product.item };
});

type ProductRecord = NonNullable<Awaited<ReturnType<typeof getProduct>>>;

const LIVE = Prisma.sql`p."status" = 'ACTIVE'::"ProductStatus" AND p."quantity" > 0`;

function metaDescription(product: ProductRecord): string {
  const item = product.item;
  const type = productTypeDef(item.productType);
  const parts = [`${item.title}: ${type?.singular.toLowerCase() ?? "product"} key for ${platformDef(item.platform)?.label}`, `activation region ${regionDef(item.region)?.label}`];
  if (item.languages.length) parts.push(`languages ${item.languages.slice(0, 4).join(", ")}`);
  return clampText(`${parts.join(", ")}. Delivered to your account after payment is confirmed.`, 160);
}

async function categoryPath(product: ProductRecord) {
  const tree = await getCategoryTree();
  const linked = product.categories.map((c) => c.category).filter((c) => c.isActive && tree.byId.has(c.id));
  const leaf = linked.find((c) => c.parentId) ?? linked[0] ?? null;
  const chain: { id: string; name: string; slug: string }[] = [];
  let current = leaf ? tree.byId.get(leaf.id) ?? null : null;
  while (current) {
    chain.unshift({ id: current.id, name: current.name, slug: current.slug });
    current = current.parentId ? tree.byId.get(current.parentId) ?? null : null;
  }
  return chain;
}

async function ids(query: Prisma.Sql): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ id: string }[]>(query);
  return rows.map((r) => r.id);
}

function paragraphs(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function longDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: Number.isInteger(amount) ? 0 : 2 }).format(amount);
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: true } };
  return pageMetadata({ title: product.metaTitle || product.name, description: metaDescription(product), path: `/product/${product.slug}`, images: false });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const item = product.item;
  const type = productTypeDef(item.productType)!;
  const platform = platformDef(item.platform)!;
  const region = regionDef(item.region)!;
  const chain = await categoryPath(product);
  const price = Number(product.price);
  const available = product.quantity > 0;
  const gameFacts = showsGameFacts(item.productType);

  const facts: KeyFact[] = [
    { label: "Product", value: type.singular },
    { label: "Platform", value: platform.label, note: `Requires ${platform.account}.` },
    { label: "Region", value: region.label, note: region.note },
  ];
  if (item.edition) facts.push({ label: "Edition", value: item.edition });
  if (item.validity) facts.push({ label: item.productType === "subscription" ? "Duration" : "Licence", value: item.validity, note: item.productType === "subscription" ? "Starts when you redeem the code." : null });
  if (item.faceValue && item.faceCurrency) facts.push({ label: "Card value", value: money(Number(item.faceValue), item.faceCurrency), note: `Added as ${item.faceCurrency} balance to an account set to ${region.label === "Global" ? "a supported country" : region.label}.` });
  if (item.productType === "gift-card" || item.productType === "subscription" || item.productType === "top-up") facts.push({ label: "Expiry", value: "Set by the issuer", note: "Redeem soon after delivery. Any redemption deadline is shown in the activation notes." });
  if (item.languages.length) facts.push({ label: "Languages", value: item.languages.slice(0, 6).join(", ") + (item.languages.length > 6 ? ` and ${item.languages.length - 6} more` : "") });
  if (gameFacts && item.releaseDate) facts.push({ label: "Released", value: longDate(item.releaseDate) });

  const details: DetailRow[] = [];
  if (gameFacts && item.developers.length) details.push({ label: "Developer", value: item.developers.join(", ") });
  if (item.publishers.length) details.push({ label: "Publisher", value: item.publishers.join(", ") });
  if (gameFacts && item.releaseDate) details.push({ label: "Release date", value: longDate(item.releaseDate) });
  if (item.genres.length) details.push({ label: "Genres", value: item.genres.map((g) => genreDef(g)?.label ?? g).join(", ") });
  if (gameFacts && item.ageRating) details.push({ label: "Age rating", value: item.ageRating });
  if (gameFacts && item.metacriticScore) details.push({ label: "Metacritic", value: `${item.metacriticScore} / 100` });
  if (item.languages.length) details.push({ label: "Languages", value: item.languages.join(", ") });
  details.push({ label: "Activation region", value: `${region.label}${item.regionNote && item.regionNote.toLowerCase() !== region.label.toLowerCase() ? ` (listed as “${item.regionNote}”)` : ""}` });
  details.push({ label: "Product code", value: product.sku });

  const requirements = showsSystemRequirements(item.productType, item.platform) && Array.isArray(item.systemRequirements) ? (item.systemRequirements as unknown as RequirementBlock[]) : null;
  const languageNote = item.languages.length ? `Supported languages: ${item.languages.join(", ")}. The game or service may not offer other languages.` : null;

  const exclude = new Set<string>([product.id]);
  const notIn = () => Prisma.sql`AND p."id" NOT IN (${Prisma.join([...exclude])})`;
  const versionIds = await ids(Prisma.sql`
    SELECT p."id" FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
    WHERE ${LIVE} AND k."productType" = ${item.productType} AND lower(k."title") = lower(${item.title}) ${notIn()}
    ORDER BY p."price" ASC LIMIT ${MERCH.related}`);
  versionIds.forEach((id) => exclude.add(id));
  const genre = item.genres[0] ?? null;
  const similarIds = await ids(Prisma.sql`
    SELECT p."id" FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
    WHERE ${LIVE} AND k."productType" = ${item.productType} AND k."platform" = ${item.platform}
      ${genre ? Prisma.sql`AND ${genre} = ANY(k."genres")` : Prisma.empty} ${notIn()}
    ORDER BY abs(p."price" - ${price}) ASC LIMIT ${MERCH.related}`);
  similarIds.forEach((id) => exclude.add(id));
  const publisher = item.publishers[0] ?? null;
  const publisherIds = publisher && gameFacts
    ? await ids(Prisma.sql`
        SELECT p."id" FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
        WHERE ${LIVE} AND ${publisher} = ANY(k."publishers") AND lower(k."title") <> lower(${item.title}) ${notIn()}
        ORDER BY k."releaseDate" DESC NULLS LAST LIMIT ${MERCH.related}`)
    : [];
  const [versions, similar, fromPublisher] = await Promise.all([loadKeyProducts(versionIds), loadKeyProducts(similarIds), loadKeyProducts(publisherIds)]);

  const platformCategory = categorySlugFor(item.productType as ProductTypeKey, item.platform as PlatformKey);
  const crumbs = [{ label: "Home", href: "/" }, { label: "All products", href: "/catalog" }, ...chain.map((c) => ({ label: c.name, href: `/catalog/${c.slug}` })), { label: item.title }];

  const jsonLd = productJsonLd({
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    description: metaDescription(product),
    images: product.images.slice(0, 1).map((i) => i.url),
    brand: publicBrand(product.brand),
    ean: null,
    gtin: null,
    price,
    available,
    condition: product.condition,
    category: chain.map((c) => c.name).join(" > ") || null,
    reviews: [],
  });

  const listing = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price,
    comparePrice: product.comparePrice != null ? Number(product.comparePrice) : null,
    quantity: product.trackInventory ? product.quantity : undefined,
    images: product.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt })),
    category: chain[chain.length - 1]?.name ?? null,
    key: keySummary(item),
  };

  return (
    <div className="mx-auto max-w-container px-gutter pb-28 lg:pb-24">
      <JsonLd data={jsonLd} />
      <RecordView id={product.id} />
      <Breadcrumbs items={crumbs} className="lg:hidden" withJsonLd={false} />

      <div data-product="" className="grid gap-x-12 gap-y-8 lg:grid-cols-12 lg:pt-8">
        <div className="min-w-0 lg:col-span-7">
          <div className="lg:sticky lg:top-[calc(var(--header-height-compact)+24px)]">
            <ProductGallery images={product.images.map((i) => ({ url: i.url, alt: i.alt }))} title={item.title} videoId={item.videoId} />
          </div>
        </div>
        <div className="min-w-0 lg:col-span-5">
          <ProductBuyBox product={listing} facts={facts} alternativesHref={`/catalog/${platformCategory}`} breadcrumbs={<Breadcrumbs items={crumbs} className="hidden pt-0 lg:block" />} />
        </div>
      </div>

      <ProductDetailTabs
        className="mt-16 lg:mt-24"
        description={paragraphs(product.description)}
        redeemHeading={redeemTitle(platform.key)}
        account={platform.account}
        redeemSteps={platform.redeem}
        activationNotes={paragraphs(item.activationNotes)}
        regionNote={`Activation region: ${region.label}. ${region.note}`}
        languageNote={languageNote}
        requirements={requirements}
        details={details}
      />

      <div className="mt-20 flex flex-col gap-20">
        <ProductRail id="versions" title="Other editions and platforms" lead="The same title in a different edition, platform or region." products={versions} />
        <ProductRail id="similar" title={`More ${type.label.toLowerCase()} on ${platform.label}`} lead={genre ? `${genreDef(genre)?.label ?? genre}, close to this price.` : "Close to this price."} products={similar} link={{ href: `/catalog/${platformCategory}`, label: `All ${type.label.toLowerCase()} on ${platform.label}` }} />
        <ProductRail id="publisher" title={publisher ? `More from ${publisher}` : "More from this publisher"} products={fromPublisher} />
        <RecentlyViewed excludeId={product.id} />
      </div>
    </div>
  );
}
