import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CartView } from "./CartView";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart.meta");
  return noindexMetadata(t("title"), t("description"), "/cart");
}

export default function CartPage() {
  return <CartView />;
}
