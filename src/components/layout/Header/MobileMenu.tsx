"use client";

import Link from "next/link";
import { ArrowRight, CalendarSync, PackagePlus, WalletCards, X } from "lucide-react";
import { Sheet } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Lamp } from "@/components/ui/Lamp";
import { useAuth } from "@/providers/AuthProvider";
import { useCurrency } from "@/providers/CurrencyProvider";
import { formatPrice } from "@/lib/utils/format-price";
import { STORE_POLICY } from "@/config/store-policy";
import { cn } from "@/lib/utils/cn";
import type { StoreIndex } from "@/lib/catalog/store-index";
import { CurrencySelect } from "./CurrencySelect";
import { ThemeToggle } from "./ThemeToggle";

const TYPE_ICON: Record<string, typeof PackagePlus> = { dlc: PackagePlus, "gift-card": WalletCards, subscription: CalendarSync };

const row = "flex min-h-12 w-full items-center justify-between gap-4 border-b border-line text-left text-step-0 text-ink";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  index: StoreIndex | null;
  pathname: string;
}

export function MobileMenu({ open, onClose, index, pathname }: MobileMenuProps) {
  const { user, role } = useAuth();
  const { currency, convert } = useCurrency();
  const platforms = index?.platforms ?? [];

  return (
    <Sheet open={open} onClose={onClose} side="bottom" label="Catalogue" className="!h-[92dvh] !bg-rig">
      <div className="flex h-full flex-col" data-mobile-map="">
        <div className="relative shrink-0 border-b border-line px-4 pb-3 pt-2">
          <span aria-hidden="true" className="mx-auto block h-1 w-8 bg-line-hover" />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="m-0 flex items-center gap-2 text-ui-sm text-ink-muted">
              <Lamp on />
              {STORE_POLICY.delivery.headline.replace(/\.$/, "")}
            </p>
            <button type="button" onClick={onClose} aria-label="Close catalogue" className="flex size-11 shrink-0 cursor-pointer items-center justify-center text-ink">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10">
          <nav aria-label="Platforms" className="pt-5">
            <p className="eyebrow m-0 mb-3">Platforms</p>
            <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
              {platforms.map((p, i) => (
                <li key={p.key} data-platform={p.tone} className={cn(i === 0 && "col-span-2")}>
                  <Link href={`/platform/${p.slug}`} onClick={onClose} aria-current={pathname === `/platform/${p.slug}` ? "page" : undefined} className="plate flex h-[76px] flex-col justify-between p-3">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="size-1.5 bg-platform" />
                      <span className="eyebrow truncate text-ink">{p.short}</span>
                    </span>
                    <span className="flex items-baseline justify-between gap-2 font-mono text-[0.75rem] text-ink-muted">
                      <span>
                        <span className="text-ink">{p.count.toLocaleString("en-GB")}</span> keys
                      </span>
                      {p.minPrice != null && i === 0 ? <span>from {formatPrice(convert(p.minPrice), currency)}</span> : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Types" className="mt-8">
            <p className="eyebrow m-0 mb-1">Types</p>
            {(index?.types ?? []).map((t) => {
              const Icon = TYPE_ICON[t.key];
              return (
                <Link key={t.key} href={`/catalog/${t.slug}`} onClick={onClose} className={cn(row, "min-h-14")}>
                  <span className="flex items-center gap-3">
                    {Icon ? <Icon size={18} aria-hidden="true" className="text-ink-muted" /> : <span aria-hidden="true" className="w-[18px]" />}
                    <span className="font-display text-step-1 font-[680] [font-stretch:112.5%]">{t.label}</span>
                    <span className="font-mono text-[0.75rem] text-ink-muted">{t.count.toLocaleString("en-GB")}</span>
                  </span>
                  <ArrowRight size={18} aria-hidden="true" className="text-ink-muted" />
                </Link>
              );
            })}
            <Link href="/deals" onClick={onClose} className={cn(row, "min-h-14")}>
              <span className="flex items-center gap-3">
                <span aria-hidden="true" className="w-[18px]" />
                <span className="font-display text-step-1 font-[680] [font-stretch:112.5%]">Deals</span>
                {index?.onSale ? <span className="font-mono text-[0.75rem] text-ink-muted">{index.onSale.toLocaleString("en-GB")}</span> : null}
              </span>
              <ArrowRight size={18} aria-hidden="true" className="text-ink-muted" />
            </Link>
            <Link href="/new-releases" onClick={onClose} className={cn(row, "min-h-14")}>
              <span className="flex items-center gap-3">
                <span aria-hidden="true" className="w-[18px]" />
                <span className="font-display text-step-1 font-[680] [font-stretch:112.5%]">New releases</span>
              </span>
              <ArrowRight size={18} aria-hidden="true" className="text-ink-muted" />
            </Link>
          </nav>

          <nav aria-label="Account" className="mt-8">
            <p className="eyebrow m-0 mb-1">Account</p>
            {user ? (
              <>
                <Link href="/account/orders" onClick={onClose} className={row}>
                  Keys and orders
                </Link>
                <Link href="/account/wishlist" onClick={onClose} className={row}>
                  Pinned
                </Link>
                <Link href="/account/profile" onClick={onClose} className={row}>
                  Profile
                </Link>
                {role === "ADMIN" || role === "SUPER_ADMIN" ? (
                  <a href="/admin" onClick={onClose} className={row}>
                    Admin
                  </a>
                ) : null}
              </>
            ) : (
              <div className="flex flex-col gap-2 py-3">
                <Button as="a" href="/auth/login?next=%2Faccount" fullWidth>
                  Sign in
                </Button>
                <Button as={Link} href="/auth/register" variant="ghost" onClick={onClose}>
                  Create an account
                </Button>
              </div>
            )}
          </nav>

          <nav aria-label="Help" className="mt-8">
            <p className="eyebrow m-0 mb-1">Help</p>
            <Link href="/how-activation-works" onClick={onClose} className={row}>
              How activation works
            </Link>
            <Link href="/faq" onClick={onClose} className={row}>
              FAQ
            </Link>
            <Link href="/contact" onClick={onClose} className={row}>
              Contact us
            </Link>
          </nav>

          <div className="pt-6">
            <div className="flex min-h-14 items-center justify-between border-b border-line">
              <CurrencySelect size="md" showLabel className="w-full justify-between" />
            </div>
            <ThemeToggle variant="row" />
          </div>
        </div>
      </div>
    </Sheet>
  );
}
