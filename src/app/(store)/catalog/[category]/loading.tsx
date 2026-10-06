import { CardGridSkeleton } from "@/components/product/ProductCard";

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-container px-gutter pb-24 pt-14">
      <div aria-hidden="true" className="h-12 w-72 max-w-full bg-surface-1" />
      <div className="mt-12 lg:grid lg:grid-cols-[288px_minmax(0,1fr)] lg:gap-10">
        <div aria-hidden="true" className="hidden flex-col gap-3 lg:flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="block h-12 border-b border-line" />
          ))}
        </div>
        <CardGridSkeleton count={12} />
      </div>
      <span role="status" className="sr-only">
        Loading products
      </span>
    </div>
  );
}
