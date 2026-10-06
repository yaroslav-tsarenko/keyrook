import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { OrderDetail } from "@/components/account/OrderDetail/OrderDetail";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.meta");
  return noindexMetadata(t("order"), t("description"), "/account/orders", false);
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetail id={id} />;
}
