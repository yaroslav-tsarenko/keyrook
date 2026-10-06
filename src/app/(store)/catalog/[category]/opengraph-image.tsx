import { getTranslations } from "next-intl/server";
import { BRAND } from "@/lib/brand";
import { STORE_POLICY } from "@/config/store-policy";
import { defaultLocale } from "@/i18n/config";
import { formatPrice } from "@/lib/utils/format-price";
import { OG_PALETTE as P, OG_SIZE } from "@/lib/og/assets";
import { Dial, DialRuler, Engraved, Wordmark, ogResponse, titleSize } from "@/lib/og/parts";
import { categoryStats, getCategoryTree } from "@/components/catalog/catalog-query";

export const revalidate = 3600;

type CategoryParams = { category: string } | Promise<{ category: string }>;

async function loadCategory(slug: string) {
  const tree = await getCategoryTree();
  const category = tree.bySlug.get(slug) ?? null;
  if (!category) return null;
  const parent = category.parentId ? tree.byId.get(category.parentId) ?? null : null;
  const stats = await categoryStats(tree.subtreeIds(category.id));
  return { category, parent, stats };
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
  const name = data ? (data.parent ? `${data.parent.name} for ${data.category.name}` : data.category.name) : BRAND.tagline;
  const eyebrow = data?.parent?.name ?? t("ogShop");
  const nameSize = titleSize(name, [[14, 84], [24, 68], [40, 56], [80, 46]]);

  return ogResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: P.room, color: P.ink, padding: "64px 72px", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640 }}>
        <Wordmark size={44} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Engraved>{eyebrow}</Engraved>
          <div style={{ display: "block", marginTop: 16, fontFamily: "Hubot Sans", fontWeight: 700, fontSize: nameSize, lineHeight: 1.02, color: P.ink, lineClamp: 3, overflow: "hidden", maxHeight: nameSize * 1.02 * 3 + 4 }}>{name}</div>
          {data && data.stats.count > 0 ? (
            <div style={{ display: "flex", alignItems: "center", marginTop: 24, fontFamily: "Red Hat Mono", fontSize: 24, color: P.inkMuted }}>
              {t("ogItems", { count: data.stats.count })}
              {data.stats.minPrice != null ? <div style={{ display: "flex", marginLeft: 20 }}>{t("ogFrom", { price: formatPrice(data.stats.minPrice, STORE_POLICY.currency) })}</div> : null}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <DialRuler width={600} detents={3} active={0} />
          <div style={{ display: "flex", marginTop: 14, fontFamily: "Red Hat Mono", fontSize: 18, color: P.inkMuted }}>{BRAND.domain}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Dial size={380} />
      </div>
    </div>,
    3600,
  );
}
