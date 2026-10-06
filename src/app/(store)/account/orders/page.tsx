import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OrderHistory } from "@/components/account/OrderHistory/OrderHistory";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.meta");
  return noindexMetadata(t("orders"), t("description"), "/account/orders", false);
}

export default function OrdersPage() {
  return <OrderHistory />;
}
