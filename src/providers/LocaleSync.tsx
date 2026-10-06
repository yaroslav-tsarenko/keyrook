"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isLocale } from "@/i18n/config";
import { readLocaleCookie, readStoredLocale, storeLocale, writeLocaleCookie } from "@/i18n/client";

export function LocaleSync() {
  const rendered = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!isLocale(rendered)) return;
    const stored = readStoredLocale();

    if (stored && stored !== rendered) {
      writeLocaleCookie(stored);
      if (readLocaleCookie() === stored) router.refresh();
      return;
    }

    if (!stored) storeLocale(rendered);
    if (readLocaleCookie() !== rendered) writeLocaleCookie(rendered);
  }, [rendered, router]);

  return null;
}
