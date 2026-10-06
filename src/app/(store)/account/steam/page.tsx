import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { noindexMetadata } from "@/lib/seo/metadata";
import { SteamAccountView } from "./SteamAccountView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.meta");
  return noindexMetadata(t("steam"), t("description"), "/account/steam");
}

export default function AccountSteamPage() {
  return (
    <Suspense fallback={null}>
      <SteamAccountView />
    </Suspense>
  );
}
