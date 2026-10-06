"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Sheet } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/layout/BrandMark";
import { NAV_CATEGORIES } from "@/config/navigation";
import { findCategory, subtreeCount, type CategoryNode } from "@/lib/hooks/useCategoryTree";
import { useAuth } from "@/providers/AuthProvider";
import { CurrencySelect } from "./CurrencySelect";
import { ThemeToggle } from "./ThemeToggle";

const typeRow =
  "relative flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 border-b border-line text-left font-display text-step-3 font-[650] leading-none text-ink before:absolute before:inset-y-4 before:-left-4 before:w-0.5 before:bg-brand before:opacity-0 aria-[current]:before:opacity-100";
const row = "flex min-h-12 w-full cursor-pointer items-center justify-between gap-4 border-b border-line text-left text-step-0 text-ink";
const count = "font-mono text-data-sm font-normal text-ink-muted";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryNode[];
  activeSlug?: string | null;
  activeRoot?: string | null;
}

export function MobileMenu({ open, onClose, categories, activeSlug = null, activeRoot = null }: MobileMenuProps) {
  const { user, role } = useAuth();
  const [panel, setPanel] = useState<string | null>(null);
  const active = panel ? findCategory(categories, panel) : undefined;
  const activeName = NAV_CATEGORIES.find((c) => c.slug === panel)?.name ?? active?.name ?? "";

  const close = () => {
    setPanel(null);
    onClose();
  };

  return (
    <Sheet open={open} onClose={close} side="right" label="Menu" className="!bg-rig">
      <div className="flex h-full flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line pl-4 pr-2">
          <Wordmark className="h-[22px] w-auto text-ink" />
          <button type="button" onClick={close} aria-label="Close menu" className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {panel ? (
            <nav aria-label={activeName} className="animate-fade-in px-4">
              <button type="button" onClick={() => setPanel(null)} className={`${row} justify-start gap-2 text-ink-muted`}>
                <ChevronLeft size={18} aria-hidden="true" />
                Back
              </button>
              <Link href={`/catalog/${panel}`} onClick={close} aria-current={activeSlug === panel ? "page" : undefined} className={`${row} font-semibold`}>
                <span>All {activeName}</span>
                {active ? <span className={count}>{subtreeCount(active)}</span> : null}
              </Link>
              {(active?.children ?? [])
                .filter((c) => subtreeCount(c) > 0)
                .map((child) => (
                  <Link key={child.id} href={`/catalog/${child.slug}`} onClick={close} aria-current={activeSlug === child.slug ? "page" : undefined} className={`${row} aria-[current]:font-semibold`}>
                    <span>{child.name}</span>
                    <span className={count}>{subtreeCount(child)}</span>
                  </Link>
                ))}
            </nav>
          ) : (
            <div className="animate-fade-in px-4">
              <nav aria-label="Weapon types">
                {NAV_CATEGORIES.map((cat) => {
                  const node = findCategory(categories, cat.slug);
                  const total = node ? subtreeCount(node) : null;
                  if (node && total === 0) return null;
                  const current = activeSlug === cat.slug ? "page" : activeRoot === cat.slug ? "true" : undefined;
                  const label = (
                    <>
                      <span className="flex items-baseline gap-3">
                        {cat.name}
                        {total !== null ? <span className={count}>{total}</span> : null}
                      </span>
                      <ChevronRight size={20} aria-hidden="true" className="text-ink-muted" />
                    </>
                  );
                  return node?.children?.length ? (
                    <button key={cat.slug} type="button" onClick={() => setPanel(cat.slug)} aria-current={current} className={typeRow} aria-label={`${cat.name}, show weapons`}>
                      {label}
                    </button>
                  ) : (
                    <Link key={cat.slug} href={`/catalog/${cat.slug}`} onClick={close} aria-current={current} className={typeRow}>
                      {label}
                    </Link>
                  );
                })}
                <Link href="/catalog" onClick={close} className={`${row} font-semibold`}>
                  All skins
                  <ChevronRight size={18} aria-hidden="true" className="text-ink-muted" />
                </Link>
              </nav>

              <nav aria-label="Account" className="mt-8">
                <p className="eyebrow pb-2">Account</p>
                {user ? (
                  <>
                    <Link href="/account/orders" onClick={close} className={row}>
                      My purchases
                    </Link>
                    <Link href="/account/steam" onClick={close} className={row}>
                      Trade URL
                    </Link>
                    <Link href="/account/wishlist" onClick={close} className={row}>
                      Saved
                    </Link>
                    <Link href="/account/profile" onClick={close} className={row}>
                      Profile
                    </Link>
                    {role === "ADMIN" || role === "SUPER_ADMIN" ? (
                      <a href="/admin" onClick={close} className={row}>
                        Admin
                      </a>
                    ) : null}
                  </>
                ) : (
                  <div className="flex flex-col gap-3 py-3">
                    <Button as="a" href="/api/auth/steam?next=%2Faccount" variant="steam" fullWidth>
                      Sign in through Steam
                    </Button>
                    <Link href="/auth/login" onClick={close} className="min-h-11 py-2 text-ui-md font-semibold text-ink">
                      Sign in with email
                    </Link>
                  </div>
                )}
              </nav>

              <nav aria-label="Help" className="mt-8">
                <p className="eyebrow pb-2">Help</p>
                <Link href="/how-it-works" onClick={close} className={row}>
                  How delivery works
                </Link>
                <Link href="/faq" onClick={close} className={row}>
                  FAQ
                </Link>
                <Link href="/contact" onClick={close} className={row}>
                  Contact us
                </Link>
              </nav>

              <div className="pb-10 pt-6">
                <div className="flex min-h-14 items-center justify-between border-b border-line">
                  <CurrencySelect size="md" showLabel className="w-full justify-between" />
                </div>
                <ThemeToggle variant="row" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}
