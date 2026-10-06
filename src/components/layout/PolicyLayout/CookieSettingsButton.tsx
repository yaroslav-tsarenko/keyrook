"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { openCookieSettings } from "@/lib/consent";

export function CookieSettingsButton() {
  const t = useTranslations("policies");
  return (
    <Button variant="outline" onPress={openCookieSettings}>
      {t("openCookieSettings")}
    </Button>
  );
}
