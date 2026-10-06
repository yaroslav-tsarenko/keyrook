import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AddressBook } from "@/components/account/AddressBook/AddressBook";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.meta");
  return noindexMetadata(t("addresses"), t("description"), "/account/addresses", false);
}

export default function AddressesPage() {
  return <AddressBook />;
}
