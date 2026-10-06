"use client";

import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import type { SortKey } from "@/components/catalog/catalog-url";

const LABEL_KEY: Record<SortKey, "sortNewest" | "sortPriceAsc" | "sortPriceDesc" | "sortPopular" | "sortName" | "sortRelevance" | "sortRelease" | "sortDiscount"> = {
  relevance: "sortRelevance",
  newest: "sortNewest",
  "price-asc": "sortPriceAsc",
  "price-desc": "sortPriceDesc",
  popular: "sortPopular",
  "name-asc": "sortName",
  "release-desc": "sortRelease",
  discount: "sortDiscount",
};

export const CATALOG_SORTS: SortKey[] = ["popular", "price-asc", "price-desc", "discount", "release-desc", "newest", "name-asc"];

interface ProductSortProps {
  value: string;
  onChange: (value: SortKey) => void;
  options?: SortKey[];
  className?: string;
}

export function ProductSort({ value, onChange, options = CATALOG_SORTS, className }: ProductSortProps) {
  const t = useTranslations("catalog");
  return (
    <Select
      size="sm"
      inlineLabel={t("sort")}
      value={value}
      onChange={(e) => onChange(e.target.value as SortKey)}
      options={options.map((key) => ({ value: key, label: t(LABEL_KEY[key]) }))}
      wrapperClassName={className}
      className="min-w-[9.5rem] lg:min-w-[11.5rem]"
    />
  );
}
