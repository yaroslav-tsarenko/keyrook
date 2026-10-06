import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ResetView } from "./ResetView";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset.meta");
  return noindexMetadata(t("title"), t("description"), "/auth/reset-password", false);
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <ResetView />
    </Suspense>
  );
}
