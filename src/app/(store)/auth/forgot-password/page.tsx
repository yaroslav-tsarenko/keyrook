import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotView } from "./ForgotView";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.forgot.meta");
  return noindexMetadata(t("title"), t("description"), "/auth/forgot-password");
}

export default function ForgotPasswordPage() {
  return <ForgotView />;
}
