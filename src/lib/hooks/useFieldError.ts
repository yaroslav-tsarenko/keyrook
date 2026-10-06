"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { VALIDATION_VALUES } from "@/lib/validators/fields";
import { STORE_POLICY } from "@/config/store-policy";

const VALUES = { ...VALIDATION_VALUES, maxPerItem: STORE_POLICY.limits.maxQtyPerItem, maxPerOrder: STORE_POLICY.limits.maxItemsPerOrder };

export function useFieldError() {
  const t = useTranslations("forms.errors");
  return useCallback(
    (message?: string | null) => {
      if (!message) return undefined;
      return t.has(message) ? t(message, VALUES) : t("generic");
    },
    [t],
  );
}
