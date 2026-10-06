import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AccountOverview } from "@/components/account/AccountOverview";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.meta");
  return noindexMetadata(t("overview"), t("description"), "/account", false);
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountOverview />
    </Suspense>
  );
}
