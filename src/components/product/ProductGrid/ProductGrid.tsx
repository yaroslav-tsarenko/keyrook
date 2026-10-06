"use client";

import { SkinGrid, SkinTray, type SkinProduct } from "@/components/skin/SkinTray";

interface ProductGridProps {
  products: SkinProduct[];
  columns?: 3 | 4;
  priorityCount?: number;
  headingLevel?: 2 | 3;
  className?: string;
}

export function ProductGrid({ products, columns = 4, priorityCount = 0, headingLevel = 3, className }: ProductGridProps) {
  return (
    <SkinGrid columns={columns} className={className}>
      {products.map((product, index) => (
        <SkinTray key={product.id} product={product} priority={index < priorityCount} headingLevel={headingLevel} />
      ))}
    </SkinGrid>
  );
}
