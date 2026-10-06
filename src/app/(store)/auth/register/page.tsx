import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RegisterView } from "./RegisterView";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register.meta");
  return noindexMetadata(t("title"), t("description"), "/auth/register");
}

export default function RegisterPage() {
  return <RegisterView />;
}
