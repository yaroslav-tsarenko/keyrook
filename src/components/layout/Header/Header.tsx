"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, ChevronDown, Menu, Search, UserKey } from "lucide-react";
import { Wordmark } from "@/components/layout/BrandMark";
import { Lamp } from "@/components/ui/Lamp";
import { Tumbler } from "@/components/ui/Tumbler";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { searchCountLabel, useStoreIndex } from "@/lib/hooks/useStoreIndex";
import { STORE_POLICY } from "@/config/store-policy";
import { cn } from "@/lib/utils/cn";
import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencySelect } from "./CurrencySelect";
import { VaultMap } from "./VaultMap";
import { MobileMenu } from "./MobileMenu";
import { SearchDialog } from "@/components/search/SearchDialog/SearchDialog";
import { CartSheet } from "@/components/cart/CartSheet/CartSheet";
import { CheckoutHeader } from "@/components/checkout/CheckoutFrame";

const RAIL: { href: string; label: string; wide?: boolean }[] = [
  { href: "/catalog/games", label: "Games" },
  { href: "/catalog/dlc", label: "DLC", wide: true },
  { href: "/catalog/gift-cards", label: "Gift cards" },
  { href: "/catalog/subscriptions", label: "Subscriptions", wide: true },
  { href: "/deals", label: "Deals" },
  { href: "/new-releases", label: "New releases", wide: true },
];

const railLink = cn(
  "active-bar label-caps relative inline-flex h-full items-center whitespace-nowrap text-[0.8125rem] text-ink-muted transition-colors duration-[120ms]",
  "hover-device:hover:text-ink aria-[current]:text-ink data-[active=true]:text-ink",
);

const action = "relative inline-flex h-11 cursor-pointer items-center gap-2 whitespace-nowrap px-2.5 text-ui-md font-[560] text-ink transition-colors duration-[120ms] hover-device:hover:bg-raised";

export function CartCount({ count }: { count: number; bump?: number }) {
  if (count <= 0) return null;
  return <Tumbler value={count > 99 ? "99" : count} size="xs" label={`${count} in cart`} slotClassName="!bg-brand !text-on-brand !shadow-none" />;
}

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`) || pathname.startsWith(`${href}-`);
}

function StoreHeader() {
  const pathname = usePathname();
  const { itemCount, openSheet, isSheetOpen } = useCart();
  const { user } = useAuth();
  const index = useStoreIndex();
  const mapId = useId();
  const [mapOpen, setMapOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [railHidden, setRailHidden] = useState(false);
  const mapTimer = useRef<number | undefined>(undefined);
  const mapTrigger = useRef<HTMLButtonElement>(null);
  const anyOpen = mapOpen || mobileOpen || searchOpen || isSheetOpen;

  useEffect(() => {
    let lastY = window.scrollY;
    let upTravel = 0;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      setCompact(y > 120);
      if (y <= 120) {
        upTravel = 0;
        setRailHidden(false);
        return;
      }
      if (dy > 0) {
        upTravel = 0;
        setRailHidden(true);
      } else if (dy < 0) {
        upTravel -= dy;
        if (upTravel >= 40) setRailHidden(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMapOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || anyOpen) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      e.preventDefault();
      setSearchOpen(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [anyOpen]);

  const openMap = useCallback((delay: number) => {
    window.clearTimeout(mapTimer.current);
    mapTimer.current = window.setTimeout(() => setMapOpen(true), delay);
  }, []);

  const closeMap = useCallback((delay: number, restoreFocus = false) => {
    window.clearTimeout(mapTimer.current);
    mapTimer.current = window.setTimeout(() => {
      setMapOpen(false);
      if (restoreFocus) mapTrigger.current?.focus();
    }, delay);
  }, []);

  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMap(0, true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mapOpen, closeMap]);

  const catalogueActive = pathname === "/catalog" || pathname.startsWith("/platform/") || pathname.startsWith("/genre/");
  const persona = user?.firstName ?? user?.name ?? null;
  const placeholder = searchCountLabel(index?.total);
  const tierTwoHidden = railHidden && !mapOpen;

  return (
    <>
      <div aria-hidden="true" className="h-[var(--header-height-mobile)] shrink-0 lg:h-[var(--header-height)]" />
      <header
        data-header=""
        data-header-state={compact ? "compact" : "top"}
        data-rail={tierTwoHidden ? "hidden" : "shown"}
        data-print-hide=""
        onPointerLeave={() => {
          if (mapOpen) closeMap(250);
        }}
        className="fixed inset-x-0 top-0 z-40"
      >
        <div
          data-tier="counter"
          className={cn(
            "relative z-[2] border-b border-line bg-rig text-ink transition-[height] duration-[200ms] ease-[var(--ease-latch)]",
            "h-[var(--header-height-mobile)]",
            compact ? "lg:h-[var(--header-height-compact)]" : "lg:h-[var(--header-tier-1)]",
          )}
        >
          <div className="mx-auto flex h-full max-w-container items-center justify-between gap-4 px-gutter lg:gap-8">
            <Link href="/" aria-label={`${BRAND.name}, home`} className="flex shrink-0 items-center text-ink">
              <Wordmark className="h-[22px] w-auto lg:h-[27px]" />
            </Link>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-haspopup="dialog"
              data-search-trigger=""
              className="group hidden h-11 max-w-[640px] flex-1 cursor-pointer items-center gap-3 border border-control bg-raised pl-3.5 pr-1.5 text-left text-ui-md text-ink-subtle shadow-machined-pressed transition-colors duration-[120ms] hover-device:hover:border-ink-muted lg:flex"
            >
              <Search size={18} aria-hidden="true" className="text-ink-muted" />
              <span className="flex-1 truncate">{placeholder}</span>
              <kbd aria-hidden="true" className="tumbler-slot text-[0.75rem] text-ink-muted">
                /
              </kbd>
            </button>

            <div className="flex items-center gap-0.5 lg:gap-1">
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className={cn(action, "w-11 justify-center px-0 lg:hidden")}>
                <Search size={20} aria-hidden="true" />
              </button>
              <Link href={user ? "/account" : "/auth/login"} className={cn(action, "hidden lg:inline-flex")} aria-label={user ? `Account${persona ? `, ${persona}` : ""}` : "Sign in"}>
                <UserKey size={20} aria-hidden="true" />
                <span>{user ? "Account" : "Sign in"}</span>
              </Link>
              <button type="button" onClick={openSheet} data-cart-target="" className={cn(action, "min-w-11 justify-center max-lg:px-1.5")}>
                <Archive size={20} aria-hidden="true" />
                <span className="hidden lg:inline">Cart</span>
                <span className="sr-only" aria-live="polite">
                  {`, ${itemCount} ${itemCount === 1 ? "key" : "keys"}`}
                </span>
                <CartCount count={itemCount} />
              </button>
              <button type="button" onClick={() => setMobileOpen(true)} aria-label="Catalogue" className={cn(action, "-mr-2 w-11 justify-center px-0 lg:hidden")}>
                <Menu size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div
          data-tier="rail"
          className={cn(
            "relative z-[1] hidden h-[var(--header-tier-2)] border-b border-line bg-rig text-ink transition-transform duration-[200ms] ease-[var(--ease-latch)] lg:block",
            tierTwoHidden && "-translate-y-full",
          )}
          inert={tierTwoHidden}
        >
          <div className="mx-auto flex h-full max-w-container items-center justify-between gap-6 px-gutter">
            <nav aria-label="Main" className="flex h-full min-w-0 items-center gap-6">
              <button
                ref={mapTrigger}
                type="button"
                data-board-trigger=""
                data-active={catalogueActive || undefined}
                aria-expanded={mapOpen}
                aria-controls={mapId}
                onClick={() => {
                  window.clearTimeout(mapTimer.current);
                  setMapOpen((v) => !v);
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") openMap(150);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse" && !mapOpen) window.clearTimeout(mapTimer.current);
                }}
                className={cn(railLink, "cursor-pointer gap-1", mapOpen && "text-ink")}
              >
                Catalogue
                <ChevronDown size={14} aria-hidden="true" className={cn("transition-transform duration-[180ms]", mapOpen && "rotate-180")} />
              </button>
              {RAIL.map((link) => (
                <Link key={link.href} href={link.href} aria-current={active(pathname, link.href) ? "page" : undefined} className={cn(railLink, link.wide && "max-xl:hidden")}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex h-full items-center gap-3">
              <p className="m-0 flex items-center gap-2 text-[0.8125rem] text-ink-muted">
                <Lamp on />
                <span className="max-2xl:hidden">{STORE_POLICY.delivery.headline.replace(/\.$/, "")}</span>
                <Link href="/policies/shipping" className="underline-offset-4 hover-device:hover:underline 2xl:hidden">
                  Delivery
                </Link>
              </p>
              <span aria-hidden="true" className="h-5 w-px bg-line" />
              <CurrencySelect />
              <ThemeToggle />
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <VaultMap id={mapId} open={mapOpen} index={index} onClose={(restore) => closeMap(0, restore)} onPointerEnter={() => window.clearTimeout(mapTimer.current)} onPointerLeave={() => closeMap(250)} />
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} index={index} pathname={pathname} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} index={index} />
      <CartSheet />
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return <CheckoutHeader />;
  return <StoreHeader />;
}
