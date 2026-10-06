"use client";

import { useTranslations } from "next-intl";
import { CardGrid, CardGridSkeleton, ProductCard, type CatalogProduct } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/shared/EmptyState/EmptyState";
import { AccountPageHeader } from "./AccountSidebar/AccountSidebar";
import { useAccountData } from "./useAccountData";
import { LoadError } from "./LoadError";

export function SavedItems() {
  const t = useTranslations("account.saved");
  const { data, error, loading, reload } = useAccountData<{ product: CatalogProduct }[]>("/api/wishlist");
  const products = (data ?? []).map((item) => item.product).filter(Boolean);
  const count = loading ? null : products.length;

  return (
    <div>
      <AccountPageHeader title={t("title")} aside={count ? <span className="font-mono text-data text-ink-muted">{count}</span> : null} />
      {loading ? (
        <CardGridSkeleton count={3} columns={3} />
      ) : error ? (
        <LoadError onRetry={reload} />
      ) : products.length === 0 ? (
        <EmptyState title="Nothing saved yet" subtitle={t("emptyBody")} actionLabel="Browse the catalogue" actionHref="/catalog" align="start" className="border-t border-line px-0 py-10" />
      ) : (
        <CardGrid columns={3}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} headingLevel={2} />
          ))}
        </CardGrid>
      )}
    </div>
  );
}
