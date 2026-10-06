"use client";

import { useTranslations } from "next-intl";
import { Select, type SelectProps } from "@/components/ui/Select";
import { DELIVERY_COUNTRIES } from "@/lib/countries";

export function CountrySelect(props: Omit<SelectProps, "options" | "children">) {
  const t = useTranslations("forms");
  return (
    <Select
      label={t("country")}
      hint={t("countryHint")}
      placeholder={t("countryPlaceholder")}
      autoComplete="country"
      {...props}
      options={DELIVERY_COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
    />
  );
}
