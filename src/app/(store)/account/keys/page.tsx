import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { KeysView } from "@/components/account/KeysView";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.meta");
  return noindexMetadata(t("keys"), t("description"), "/account/keys", false);
}

export default function KeysPage() {
  return <KeysView />;
}
