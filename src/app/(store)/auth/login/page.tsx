import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LoginView } from "./LoginView";
import { noindexMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login.meta");
  return noindexMetadata(t("title"), t("description"), "/auth/login");
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <LoginView />
    </Suspense>
  );
}
