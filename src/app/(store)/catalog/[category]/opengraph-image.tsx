import { getTranslations } from "next-intl/server";
import { BRAND } from "@/lib/brand";
import { STORE_POLICY } from "@/config/store-policy";
import { defaultLocale } from "@/i18n/config";
import { formatPrice } from "@/lib/utils/format-price";
import { OG_PALETTE as P, OG_SIZE, ogImageSource } from "@/lib/og/assets";
import { Stage, Wordmark, ogResponse, titleSize } from "@/lib/og/parts";
import { categoryStats, getCategoryTree } from "@/components/catalog/catalog-query";

export const revalidate = 3600;

type CategoryParams = { category: string } | Promise<{ category: string }>;

async function loadCategory(slug: string) {
  const tree = await getCategoryTree();
  const category = tree.bySlug.get(slug) ?? null;
  if (!category) return null;
  const parent = category.parentId ? tree.byId.get(category.parentId) ?? null : null;
  const stats = await categoryStats(tree.subtreeIds(category.id));
  return { category, parent, stats, art: tree.uniqueArt(category) ?? category.imageUrl };
}

export async function generateImageMetadata({ params }: { params: CategoryParams }) {
  const { category: slug } = await params;
  const tree = await getCategoryTree();
  const t = await getTranslations({ locale: defaultLocale, namespace: "seo" });
  const name = (slug && tree.bySlug.get(slug)?.name) || BRAND.tagline;
  return [{ id: "card", size: OG_SIZE, contentType: "image/png", alt: t("ogCategoryAlt", { name, brand: BRAND.name }) }];
}

export default async function Image({ params }: { params: CategoryParams }) {
  const { category: slug } = await params;
  const t = await getTranslations({ locale: defaultLocale, namespace: "seo" });
  const data = await loadCategory(slug);
  const name = data?.category.name ?? BRAND.tagline;
  const eyebrow = data?.parent?.name ?? t("ogShop");
  const src = data ? await ogImageSource(data.art, 900) : null;
  const nameSize = titleSize(name, [[14, 92], [24, 76], [40, 62], [80, 50]]);

  return ogResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: P.room, color: P.ink, padding: "64px 72px", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 560 }}>
        <Wordmark size={48} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontFamily: "Martian Mono", fontSize: 20, letterSpacing: 2, textTransform: "uppercase", color: P.inkMuted, marginBottom: 16 }}>{eyebrow}</div>
          <div style={{ display: "block", fontFamily: "Sofia Sans Condensed", fontWeight: 700, fontSize: nameSize, lineHeight: 1.02, color: P.ink, lineClamp: 3, overflow: "hidden", maxHeight: nameSize * 1.02 * 3 + 4 }}>{name}</div>
          {data && data.stats.count > 0 ? (
            <div style={{ display: "flex", alignItems: "center", marginTop: 24, fontFamily: "Martian Mono", fontSize: 24, color: P.inkMuted }}>
              {t("ogItems", { count: data.stats.count })}
              {data.stats.minPrice != null ? <div style={{ display: "flex", marginLeft: 20 }}>{t("ogFrom", { price: formatPrice(data.stats.minPrice, STORE_POLICY.currency) })}</div> : null}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", fontFamily: "Martian Mono", fontSize: 18, color: P.inkMuted }}>{BRAND.domain}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Stage src={src} width={480} height={480} />
      </div>
    </div>,
    3600,
  );
}
