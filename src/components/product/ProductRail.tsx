import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProductCard, type CatalogProduct } from "./ProductCard";
import { shelfAspect } from "./product-face";

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-10 items-center gap-1.5 text-ui-md font-[560] text-ink decoration-1 underline-offset-4 hover-device:hover:underline", className)}>
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}

export function SectionHead({ id, eyebrow, title, lead, link, className }: { id: string; eyebrow?: string; title: string; lead?: ReactNode; link?: { href: string; label: ReactNode }; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-10 gap-y-3", className)}>
      <div className="min-w-0 max-w-[62ch]">
        {eyebrow ? <p className="eyebrow m-0 mb-3">{eyebrow}</p> : null}
        <h2 id={id} className="m-0 text-step-4 leading-[1.06] text-ink">
          {title}
        </h2>
        {lead ? <p className="m-0 mt-2 text-step-0 leading-[1.55] text-ink-muted">{lead}</p> : null}
      </div>
      {link ? <TextLink href={link.href}>{link.label}</TextLink> : null}
    </div>
  );
}

export function ProductRail({
  id,
  title,
  lead,
  products,
  link,
  showCompare = true,
  columns = 5,
  className,
}: {
  id: string;
  title: string;
  lead?: string;
  products: CatalogProduct[];
  link?: { href: string; label: string };
  showCompare?: boolean;
  columns?: 4 | 5;
  className?: string;
}) {
  if (products.length === 0) return null;
  const aspect = shelfAspect(products);
  return (
    <section aria-labelledby={`${id}-title`} data-section={id} className={className}>
      <SectionHead id={`${id}-title`} title={title} lead={lead} link={link} />
      <div className={cn("no-scrollbar -mx-gutter mt-6 flex snap-x scroll-px-gutter gap-2.5 overflow-x-auto px-gutter pb-2 lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:px-0", columns === 5 ? "lg:grid-cols-4 2xl:grid-cols-5" : "lg:grid-cols-4")}>
        {products.map((p, i) => (
          <div key={p.id} className={cn("w-[min(44vw,240px)] shrink-0 snap-start lg:w-auto", columns === 5 && i === 4 && "lg:max-2xl:hidden")}>
            <ProductCard product={p} showCompare={showCompare} aspect={aspect} />
          </div>
        ))}
      </div>
    </section>
  );
}
