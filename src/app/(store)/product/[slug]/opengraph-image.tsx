import { cache } from "react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { STORE_POLICY } from "@/config/store-policy";
import { defaultLocale } from "@/i18n/config";
import { formatPrice } from "@/lib/utils/format-price";
import { OG_PALETTE as P, OG_PLATFORM, OG_SIZE } from "@/lib/og/assets";
import { Dial, DialRuler, Engraved, Wordmark, ogResponse, titleSize } from "@/lib/og/parts";
import { platformInfo, regionTag, typeTag } from "@/lib/catalog/platforms";
import { stripSupplierMentions } from "@/lib/utils/supplier";

export const revalidate = 3600;

type SlugParams = { slug: string } | Promise<{ slug: string }>;

const loadProduct = cache(async (slug: string) =>
  prisma.product.findUnique({
    where: { slug },
    select: {
      name: true,
      status: true,
      price: true,
      item: { select: { title: true, platform: true, region: true, productType: true } },
    },
  }),
);

export async function generateImageMetadata({ params }: { params: SlugParams }) {
  const { slug } = await params;
  const product = slug ? await loadProduct(slug) : null;
  const t = await getTranslations({ locale: defaultLocale, namespace: "seo" });
  const name = product?.status === "ACTIVE" ? stripSupplierMentions(product.name) : BRAND.tagline;
  return [{ id: "card", size: OG_SIZE, contentType: "image/png", alt: t("ogProductAlt", { name, brand: BRAND.name }) }];
}

export default async function Image({ params }: { params: SlugParams }) {
  const { slug } = await params;
  const product = await loadProduct(slug);

  const active = product?.status === "ACTIVE";
  const name = active ? stripSupplierMentions(product.item?.title ?? product.name) : BRAND.tagline;
  const price = active ? Number(product.price) : null;
  const platform = active && product.item ? platformInfo(product.item.platform) : null;
  const region = active && product.item ? regionTag(product.item.region) : null;
  const type = active && product.item ? typeTag(product.item.productType) : null;
  const nameSize = titleSize(name, [[24, 64], [44, 54], [72, 46], [110, 40]]);

  return ogResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: P.room, color: P.ink, padding: "64px 72px", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 700 }}>
        <Wordmark size={44} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {platform ? (
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", width: 12, height: 12, background: OG_PLATFORM[platform.tone] }} />
              <Engraved color={P.ink}>{platform.short}</Engraved>
              {region ? <div style={{ display: "flex", fontFamily: "Red Hat Mono", fontSize: 18, color: P.ink }}>{`·  ${region.toUpperCase()}`}</div> : null}
              {type ? <div style={{ display: "flex", fontFamily: "Hubot Sans Wide", fontSize: 18, letterSpacing: 2, color: P.inkMuted }}>{`·  ${type.toUpperCase()}`}</div> : null}
            </div>
          ) : null}
          <div style={{ display: "block", marginTop: 20, fontFamily: "Hubot Sans", fontWeight: 700, fontSize: nameSize, lineHeight: 1.02, color: P.ink, lineClamp: 4, overflow: "hidden", maxHeight: nameSize * 1.02 * 4 + 4 }}>{name}</div>
          {price != null && price > 0 ? <div style={{ display: "flex", marginTop: 28, fontFamily: "Red Hat Mono", fontSize: 40, color: P.ink }}>{formatPrice(price, STORE_POLICY.currency)}</div> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <DialRuler width={640} detents={3} active={1} />
          <div style={{ display: "flex", marginTop: 14, fontFamily: "Red Hat Mono", fontSize: 18, color: P.inkMuted }}>{BRAND.domain}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Dial size={340} />
      </div>
    </div>,
    3600,
  );
}
