import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SavedItems } from "@/components/account/SavedItems";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.meta");
  return noindexMetadata(t("saved"), t("description"), "/account/wishlist", false);
}

export default function WishlistPage() {
  return <SavedItems />;
}
