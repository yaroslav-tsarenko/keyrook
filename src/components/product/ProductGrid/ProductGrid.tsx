"use client";

import { CardGrid, ProductCard, type CatalogProduct } from "@/components/product/ProductCard";

interface ProductGridProps {
  products: CatalogProduct[];
  columns?: 3 | 4 | 5;
  priorityCount?: number;
  headingLevel?: 2 | 3;
  className?: string;
}

export function ProductGrid({ products, columns = 4, priorityCount = 0, headingLevel = 3, className }: ProductGridProps) {
  return (
    <CardGrid columns={columns} className={className}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < priorityCount} headingLevel={headingLevel} />
      ))}
    </CardGrid>
  );
}
