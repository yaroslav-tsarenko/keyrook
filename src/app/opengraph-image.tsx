import { getTranslations } from "next-intl/server";
import { BRAND } from "@/lib/brand";
import { defaultLocale } from "@/i18n/config";
import { OG_PALETTE as P, OG_SIZE } from "@/lib/og/assets";
import { Dial, DialRuler, Engraved, Wordmark, ogResponse } from "@/lib/og/parts";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${BRAND.name}: ${BRAND.tagline}`;

export default async function Image() {
  const t = await getTranslations({ locale: defaultLocale, namespace: "seo" });

  return ogResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: P.room, color: P.ink, padding: "64px 72px", justifyContent: "space-between", alignItems: "stretch" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 660 }}>
        <Wordmark size={64} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Engraved>Game key store</Engraved>
          <div style={{ display: "flex", marginTop: 18, fontFamily: "Hubot Sans", fontWeight: 700, fontSize: 60, lineHeight: 1.0, letterSpacing: -1 }}>Game keys, kept under lock until they’re yours.</div>
          <div style={{ display: "flex", marginTop: 24, maxWidth: 620, fontFamily: "Mona Sans", fontSize: 24, lineHeight: 1.45, color: P.inkMuted }}>{t("siteDescription")}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <DialRuler width={620} detents={3} active={2} />
          <div style={{ display: "flex", marginTop: 14, fontFamily: "Red Hat Mono", fontSize: 18, color: P.inkMuted }}>{BRAND.domain}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Dial size={420} />
      </div>
    </div>,
  );
}
