import { getTranslations } from "next-intl/server";
import { BRAND } from "@/lib/brand";
import { defaultLocale } from "@/i18n/config";
import { OG_PALETTE as P, OG_SIZE } from "@/lib/og/assets";
import { Ruler, Wordmark, ogResponse } from "@/lib/og/parts";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${BRAND.name}: ${BRAND.tagline}`;

export default async function Image() {
  const t = await getTranslations({ locale: defaultLocale, namespace: "seo" });

  return ogResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: P.room, color: P.ink, padding: "72px 80px", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 1040 }}>
        <Wordmark size={112} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", maxWidth: 820, fontFamily: "Source Sans 3", fontSize: 40, lineHeight: 1.3, color: P.inkMuted }}>{t("siteDescription")}</div>
          <div style={{ display: "flex", marginTop: 40 }}>
            <Ruler width={1040} />
          </div>
          <div style={{ display: "flex", marginTop: 18, fontFamily: "Martian Mono", fontSize: 20, color: P.inkMuted }}>{BRAND.domain}</div>
        </div>
      </div>
    </div>,
  );
}
