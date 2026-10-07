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
import { ProductMedia } from "@/components/product/ProductMedia";
import { BuyBox, type PlatformAlternative } from "@/components/product/BuyBox";
import { EditionSelector, type EditionOption } from "@/components/product/EditionSelector";
import { BeforeYouBuy, RequiresLink, type RequirementRow } from "@/components/product/BeforeYouBuy";
import { ProductDetailTabs, type DetailRow, type RequirementBlock } from "@/components/product/ProductDetailTabs";
import { LabelRow, ProductRow } from "@/components/product/ProductCard";
import { productFace } from "@/components/product/product-face";
import { ProductRail } from "@/components/product/ProductRail";
import { productJsonLd } from "@/components/product/product-structured-data";
import { RecentlyViewed, RecordView } from "@/components/product/RecentlyViewed";
import { PriceDisplay } from "@/components/shared/PriceDisplay/PriceDisplay";
import { KEY_SELECT, keySummary, loadKeyProducts } from "@/components/catalog/catalog-query";
import { genreDef, platformDef, productTypeDef, regionDef, showsGameFacts } from "@/lib/keys/taxonomy";
import { PC_LAUNCHERS, platformInfo, regionSentence } from "@/lib/catalog/platforms";
import { activationFor } from "@/config/activation";
import { STORE_POLICY } from "@/config/store-policy";

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
      price: true,
      comparePrice: true,
      quantity: true,
      trackInventory: true,
      metaTitle: true,
      status: true,
      brand: true,
      condition: true,
      item: { select: { ...KEY_SELECT, regionNote: true, releaseDate: true, developers: true, publishers: true, ageRating: true, systemRequirements: true, activationNotes: true, videoId: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, url: true, alt: true } },
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
  const parts = [`${item.title}: ${type?.singular.toLowerCase() ?? "product"} key for ${platformDef(item.platform)?.label}`, `region ${regionDef(item.region)?.label}`];
  if (item.languages.length) parts.push(`languages ${item.languages.slice(0, 4).join(", ")}`);
  return clampText(`${parts.join(", ")}. Delivered to your account after payment is confirmed.`, 160);
}

function normaliseTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function baseTitle(title: string, edition: string | null): string {
  let base = title;
  if (edition) {
    const at = base.toLowerCase().lastIndexOf(edition.toLowerCase());
    if (at > 0) base = base.slice(0, at);
  }
  return base.replace(/[\s:–—-]+$/, "").trim();
}

function editionAdds(edition: string | null, base: string, title: string): string | null {
  const plus = /\+\s*([^()]+)$/.exec(title.slice(base.length));
  return plus ? `+ ${plus[1].trim()}` : null;
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

interface SiblingRow {
  id: string;
  slug: string;
  title: string;
  edition: string | null;
  platform: string;
  region: string;
  price: number;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const item = product.item;
  const kind = item.productType;
  const type = productTypeDef(kind)!;
  const platform = platformInfo(item.platform);
  const platformDefinition = platformDef(item.platform);
  const region = regionDef(item.region);
  const guide = activationFor(item.platform);
  const price = Number(product.price);
  const available = product.quantity > 0;
  const gameFacts = showsGameFacts(kind);
  const face = productFace(product.name, keySummary(item));

  const base = baseTitle(item.title, item.edition);
  const baseKey = normaliseTitle(base);
  const siblings = (
    await prisma.$queryRaw<SiblingRow[]>`
      SELECT p."id", p."slug", k."title", k."edition", k."platform", k."region", p."price"::float AS price
      FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
      WHERE ${LIVE} AND k."productType" = ${kind} AND k."title" ILIKE ${`${base.replace(/[\\%_]/g, (c) => `\\${c}`)}%`}
      ORDER BY p."price" ASC LIMIT 60`
  ).filter((s) => normaliseTitle(baseTitle(s.title, s.edition)) === baseKey);

  const editionPool = siblings.filter((s) => s.platform === item.platform && s.region === item.region);
  const editionMap = new Map<string, SiblingRow>();
  for (const s of editionPool) {
    const k = (s.edition ?? "Standard").toLowerCase();
    if (!editionMap.has(k) || s.id === product.id) editionMap.set(k, s);
  }
  const editions: EditionOption[] = [...editionMap.values()]
    .map((s) => ({ id: s.id, slug: s.slug, name: s.edition ?? "Standard edition", adds: editionAdds(s.edition, base, s.title), price: s.price, current: s.id === product.id }))
    .sort((a, b) => a.price - b.price);
  if (available && !editions.some((e) => e.current)) editions.push({ id: product.id, slug: product.slug, name: item.edition ?? "Standard edition", adds: null, price, current: true });

  const otherPlatforms = new Map<string, SiblingRow>();
  for (const s of siblings) if (s.platform !== item.platform && !otherPlatforms.has(s.platform) && (s.edition ?? null) === (item.edition ?? null)) otherPlatforms.set(s.platform, s);
  const otherIds = [...otherPlatforms.values()].slice(0, 5).map((s) => s.id);
  const alternatives: PlatformAlternative[] = [...otherPlatforms.values()].map((s) => ({ label: platformInfo(s.platform).short, href: `/product/${s.slug}`, tone: platformInfo(s.platform).tone }));

  let baseGame: { slug: string; title: string } | null = null;
  if (kind === "dlc") {
    const head = item.title.split(/\s[–—-]\s|:\s/)[0]?.trim();
    if (head && head.length > 2 && head.toLowerCase() !== item.title.toLowerCase()) {
      const rows = await prisma.$queryRaw<{ slug: string; title: string }[]>`
        SELECT p."slug", k."title" FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
        WHERE ${LIVE} AND k."productType" = 'game' AND k."platform" = ${item.platform} AND k."title" ILIKE ${head.replace(/[\\%_]/g, (c) => `\\${c}`)}
        ORDER BY (k."region" = ${item.region}) DESC, p."price" ASC LIMIT 1`;
      baseGame = rows[0] ?? null;
    }
  }

  const genre = item.genres[0] ?? null;
  const exclude = [product.id, ...siblings.map((s) => s.id)];
  const moreIds = (
    await prisma.$queryRaw<{ id: string }[]>`
      SELECT p."id" FROM "Product" p JOIN "KeyItem" k ON k."productId" = p."id"
      WHERE ${LIVE} AND k."productType" = ${kind} AND k."platform" = ${item.platform}
        ${genre ? Prisma.sql`AND k."genres" @> ARRAY[${genre}]::text[]` : Prisma.empty}
        AND p."id" NOT IN (${Prisma.join(exclude)})
      ORDER BY abs(p."price" - ${price}) ASC LIMIT 5`
  ).map((r) => r.id);
  const [more, others] = await Promise.all([loadKeyProducts(moreIds), loadKeyProducts(otherIds)]);

  const requirementRows: RequirementRow[] = [];
  requirementRows.push({ key: "platform", label: "Platform", icon: "platform", value: guide?.sentence ?? `Activates on ${platform.label}. You need ${platformDefinition?.account ?? "an account with the named service"}.` });
  requirementRows.push({
    key: "region",
    label: "Region",
    icon: "region",
    value: item.region === "global" ? "Global: no regional lock" : `${region?.label ?? item.region} only: ${regionSentence(item.region).replace(/^Activates/, "activates")}`,
    note: item.regionNote && item.regionNote.trim() ? item.regionNote.trim() : null,
  });
  if (kind !== "gift-card" && kind !== "top-up") {
    requirementRows.push({ key: "languages", label: "Languages", icon: "languages", value: item.languages.length ? item.languages.join(", ") : "Not specified by the publisher" });
  }
  if (kind === "dlc") {
    requirementRows.push({
      key: "requires",
      label: "Requires",
      icon: "requires",
      value: baseGame ? (
        <>
          The base game <RequiresLink href={`/product/${baseGame.slug}`} title={baseGame.title} /> on the same platform and region
        </>
      ) : (
        "The base game on the same platform"
      ),
    });
  }
  if (kind === "subscription") requirementRows.push({ key: "validity", label: "Validity", icon: "validity", value: item.validity ? `${item.validity}, starting when you redeem the code` : "Duration set by the issuer, see activation details" });
  if (kind === "gift-card" || kind === "top-up") {
    const value = item.faceValue && item.faceCurrency ? money(Number(item.faceValue), item.faceCurrency) : face.value;
    requirementRows.push({ key: "validity", label: "Validity", icon: "card", value: `${value ? `Value ${value}. ` : ""}Expiry set by the issuer, see activation details` });
  }
  if (item.ageRating) requirementRows.push({ key: "age", label: "Age rating", icon: "age", value: item.ageRating });
  requirementRows.push({ key: "delivery", label: "Delivery", icon: "delivery", value: STORE_POLICY.delivery.short });

  const details: DetailRow[] = [];
  details.push({ label: "Platform", value: platform.label });
  details.push({ label: "Region", value: `${region?.label ?? item.region}${item.regionNote ? ` (listed as “${item.regionNote}”)` : ""}` });
  details.push({ label: "Type", value: face.kind === "game" ? "Base game" : face.typeSentence });
  if (item.edition) details.push({ label: "Edition", value: item.edition });
  if (item.languages.length) details.push({ label: "Languages", value: item.languages.join(", ") });
  if (gameFacts && item.developers.length) details.push({ label: "Developer", value: item.developers.join(", ") });
  if (item.publishers.length) details.push({ label: "Publisher", value: item.publishers.join(", ") });
  if (gameFacts && item.releaseDate) details.push({ label: "Release date", value: longDate(item.releaseDate) });
  if (item.genres.length) details.push({ label: "Genres", value: item.genres.map((g) => genreDef(g)?.label ?? g).join(", ") });
  if (item.ageRating) details.push({ label: "Age rating", value: item.ageRating });
  details.push({ label: "Keyrook catalogue no.", value: product.sku, mono: true });

  const showsRequirements = PC_LAUNCHERS.has(item.platform) && (kind === "game" || kind === "dlc" || kind === "software") && Array.isArray(item.systemRequirements) && (item.systemRequirements as unknown[]).length > 0;
  const requirements = showsRequirements ? (item.systemRequirements as unknown as RequirementBlock[]) : null;

  const factsLine = [item.developers[0], item.publishers[0] && item.publishers[0] !== item.developers[0] ? item.publishers[0] : null, item.releaseYear ? String(item.releaseYear) : null].filter(Boolean).join(" · ");
  const genreCrumb = genre ? genreDef(genre) : null;
  const crumbs = [
    { label: "Catalogue", href: "/catalog" },
    { label: platform.short, href: `/platform/${platform.slug}` },
    ...(genreCrumb ? [{ label: genreCrumb.label, href: `/genre/${genreCrumb.key}` }] : [{ label: type.label, href: `/catalog/${type.slug}` }]),
    { label: item.title },
  ];

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
    category: [type.label, platform.label].join(" > "),
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
    key: keySummary(item),
  };

  return (
    <div data-product="" data-platform={platform.tone} className="mx-auto max-w-container px-gutter pb-28 lg:pb-24">
      <JsonLd data={jsonLd} />
      <RecordView id={product.id} />
      <Breadcrumbs items={crumbs} className="lg:hidden" withJsonLd={false} />

      <div className="grid grid-cols-[40%_minmax(0,1fr)] gap-x-4 gap-y-6 pt-1 lg:grid-cols-12 lg:gap-x-10 lg:pt-8">
        <div className="min-w-0 lg:col-span-5 lg:row-span-2">
          <div className="lg:sticky lg:top-[calc(var(--header-height-compact)+24px)]">
            <ProductMedia images={product.images.map((i) => ({ url: i.url, alt: i.alt }))} title={item.title} videoId={item.videoId} platformLabel={platform.short} aspect={kind === "gift-card" || kind === "top-up" ? "card" : "3/4"} parts="cover" className="lg:hidden" />
            <ProductMedia images={product.images.map((i) => ({ url: i.url, alt: i.alt }))} title={item.title} videoId={item.videoId} platformLabel={platform.short} aspect={kind === "gift-card" || kind === "top-up" ? "card" : "3/4"} className="max-lg:hidden" />
          </div>
        </div>

        <div className="min-w-0 lg:col-span-7">
          <Breadcrumbs items={crumbs} className="hidden pt-0 lg:block" />
          <LabelRow face={face} size="md" edition className="flex-wrap gap-y-2" />
          <h1 className="m-0 mt-3 text-step-4 leading-[1.04] text-ink [overflow-wrap:anywhere] lg:text-step-5">{item.title}</h1>
          {factsLine ? <p className="m-0 mt-2 text-ui-md text-ink-muted">{factsLine}</p> : null}
          <div className="mt-4 lg:hidden">
            {available ? <PriceDisplay price={price} comparePrice={listing.comparePrice} size="md" /> : <span className="text-ui-md text-ink-muted">Out of stock</span>}
          </div>
        </div>

        <div className="col-span-2 flex min-w-0 flex-col gap-8 lg:col-span-7 lg:col-start-6">
          <ProductMedia images={product.images.map((i) => ({ url: i.url, alt: i.alt }))} title={item.title} videoId={item.videoId} parts="strip" className="lg:hidden" />
          <EditionSelector options={editions} />
          <BuyBox product={listing} alternatives={alternatives} />
          <BeforeYouBuy rows={requirementRows} />
        </div>
      </div>

      <ProductDetailTabs
        className="mt-16 lg:mt-24"
        description={paragraphs(product.description)}
        guide={guide}
        guideAnchor={guide ? platform.slug : null}
        account={platformDefinition?.account ?? "an account with the service named in the activation notes"}
        fallbackSteps={platformDefinition?.redeem ?? []}
        activationNotes={paragraphs(item.activationNotes)}
        requirements={requirements}
        details={details}
      />

      <div className="mt-20 flex flex-col gap-20">
        {others.length ? (
          <section aria-labelledby="other-platforms-title">
            <h2 id="other-platforms-title" className="m-0 text-step-4 leading-[1.06] text-ink">
              Also on other platforms
            </h2>
            <ul className="m-0 mt-6 grid list-none border-t border-rule p-0 md:grid-cols-2 md:gap-x-10">
              {others.map((o) => (
                <li key={o.id} className="border-b border-line py-3">
                  <ProductRow name={o.name} href={`/product/${o.slug}`} imageUrl={o.images?.[0]?.url} keyInfo={o.key} aside={<PriceDisplay price={Number(o.price)} size="sm" />} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <ProductRail id="more" title={`More for ${platform.short}`} lead={genreCrumb ? `${genreCrumb.label}, close to this price.` : "Close to this price."} products={more} link={{ href: `/platform/${platform.slug}`, label: `All ${platform.short} keys` }} />
        <RecentlyViewed excludeId={product.id} />
      </div>
    </div>
  );
}
