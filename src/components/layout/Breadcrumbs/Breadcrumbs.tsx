import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { JsonLd } from "@/components/shared/SEO/JsonLd";
import { SITE_URL } from "@/lib/brand";
import { cn } from "@/lib/utils/cn";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  withJsonLd?: boolean;
}

export function Breadcrumbs({ items, className, withJsonLd = true }: BreadcrumbsProps) {
  const parent = [...items].reverse().find((item, index) => index > 0 && item.href);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <nav aria-label="Breadcrumb" className={cn("meta pb-4 pt-5", className)}>
      {withJsonLd ? <JsonLd data={jsonLd} /> : null}
      <ol className="m-0 hidden list-none flex-wrap items-center gap-2 p-0 sm:flex">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="font-mono text-ink-subtle">
                  /
                </span>
              ) : null}
              {item.href && !last ? (
                <Link href={item.href} className="text-ink-muted underline-offset-4 hover-device:hover:text-ink hover-device:hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className="truncate text-ink">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {parent?.href ? (
        <Link href={parent.href} className="inline-flex min-h-11 items-center gap-1.5 text-ink-muted hover:text-ink sm:hidden">
          <ArrowLeft size={16} aria-hidden="true" />
          {parent.label}
        </Link>
      ) : null}
    </nav>
  );
}
