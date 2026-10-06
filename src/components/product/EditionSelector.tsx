"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Lamp } from "@/components/ui/Lamp";
import { formatPrice } from "@/lib/utils/format-price";
import { useCurrency } from "@/providers/CurrencyProvider";

export interface EditionOption {
  id: string;
  slug: string;
  name: string;
  adds: string | null;
  price: number;
  current: boolean;
}

export function EditionSelector({ options, className }: { options: EditionOption[]; className?: string }) {
  const { currency, convert } = useCurrency();
  if (options.length < 2) return null;
  return (
    <div className={className}>
      <p id="edition-label" className="eyebrow m-0 mb-2">
        Edition
      </p>
      <ul role="radiogroup" aria-labelledby="edition-label" className="m-0 list-none border-y border-line p-0">
        {options.map((option) => (
          <li key={option.id} className="border-b border-line last:border-b-0">
            <Link
              href={`/product/${option.slug}`}
              role="radio"
              aria-checked={option.current}
              aria-current={option.current ? "page" : undefined}
              scroll={false}
              className={cn(
                "flex min-h-12 items-center gap-3 px-3 py-2 transition-colors duration-[120ms]",
                option.current ? "bg-brand-soft" : "hover-device:hover:bg-raised",
              )}
            >
              <Lamp on={option.current} />
              <span className="min-w-0 flex-1">
                <span className="block text-ui-md font-[560] text-ink">{option.name}</span>
                {option.adds ? <span className="block text-ui-sm text-ink-muted">{option.adds}</span> : null}
              </span>
              <span className="price shrink-0 text-ui-md text-ink">{formatPrice(convert(option.price), currency)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
