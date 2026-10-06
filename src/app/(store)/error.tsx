"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { COMPANY } from "@/lib/company";

export default function StoreError({
  error,
  unstable_retry,
  reset,
}: {
  error: Error & { digest?: string };
  unstable_retry?: () => void;
  reset?: () => void;
}) {
  const t = useTranslations("errors");
  const common = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  const retry = () => (unstable_retry ?? reset)?.();

  return (
    <div className="mx-auto max-w-container px-gutter pb-24 pt-12 lg:pt-20">
      <div className="measure">
        <h1 className="m-0 text-step-5 font-[650] leading-none tracking-[-0.01em] text-ink">{t("serverErrorTitle")}</h1>
        <div className="mt-6">
          <Alert tone="danger" title={t("serverError")}>
            <p className="m-0">{t("serverErrorBody", { email: COMPANY.email })}</p>
            {error.digest ? <p className="meta m-0 mt-2 font-mono text-ink-muted">{t("errorReference", { digest: error.digest })}</p> : null}
          </Alert>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-6">
          <Button variant="outline" onPress={retry}>
            {common("retry")}
          </Button>
          <Button as={Link} href="/" variant="ghost">
            {t("backHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
