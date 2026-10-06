import { ProductCard, type CatalogProduct } from "@/components/product/ProductCard";
import { SectionHead } from "./SectionHead";

export function ProductRail({
  id,
  title,
  lead,
  products,
  link,
  showCompare = false,
  className,
}: {
  id: string;
  title: string;
  lead?: string;
  products: CatalogProduct[];
  link?: { href: string; label: string };
  showCompare?: boolean;
  className?: string;
}) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={`${id}-title`} data-section={id} className={className}>
      <SectionHead id={`${id}-title`} title={title} lead={lead} link={link} />
      <div className="no-scrollbar -mx-gutter mt-8 flex snap-x gap-3 overflow-x-auto px-gutter pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0">
        {products.map((p) => (
          <div key={p.id} className="w-[min(72vw,280px)] shrink-0 snap-start lg:w-auto">
            <ProductCard product={p} showCompare={showCompare} />
          </div>
        ))}
      </div>
    </section>
  );
}
