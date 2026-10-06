"use client";

import { CardGrid, FeatureBox, ProductCard, type CatalogProduct } from "@/components/product/ProductCard";
import { shelfAspect } from "@/components/product/product-face";
import { ResultsSettle } from "@/components/motion/ResultsSettle";

interface ProductGridProps {
  products: CatalogProduct[];
  feature?: CatalogProduct | null;
  columns?: 3 | 4 | 5;
  priorityCount?: number;
  headingLevel?: 2 | 3;
  className?: string;
}

export function ProductGrid({ products, feature, columns = 4, priorityCount = 0, headingLevel = 3, className }: ProductGridProps) {
  const rest = feature ? products.filter((p) => p.id !== feature.id) : products;
  const aspect = shelfAspect(rest);
  return (
    <CardGrid columns={columns} className={className}>
      {feature ? <FeatureBox product={feature} priority headingLevel={headingLevel} className="col-span-2" /> : null}
      {rest.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < priorityCount} headingLevel={headingLevel} aspect={aspect} />
      ))}
      <ResultsSettle keys={products.map((p) => `/product/${p.slug}`)} />
    </CardGrid>
  );
}
