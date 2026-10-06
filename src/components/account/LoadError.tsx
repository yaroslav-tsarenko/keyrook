"use client";

import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("account");
  return (
    <Alert
      tone="danger"
      title={t("loadError")}
      action={
        <Button variant="outline" size="sm" onPress={onRetry}>
          {t("retry")}
        </Button>
      }
    />
  );
}
