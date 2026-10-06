"use client";

import { Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AlignRight, ChevronDown, CircleUser, Search, ShoppingCart } from "lucide-react";
import { Wordmark } from "@/components/layout/BrandMark";
import { useCart } from "@/providers/CartProvider";
import { useAuth } from "@/providers/AuthProvider";
import { useSteamAccount } from "@/components/account/SteamDelivery/SteamDelivery";
import { catalogSlugFromPath, findRootSlug, useCategoryTree } from "@/lib/hooks/useCategoryTree";
import { RIG_LINKS, navCategory } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";
import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "./ThemeToggle";
import { CurrencySelect } from "./CurrencySelect";
import { LoadoutBoard } from "./LoadoutBoard";
import { MobileMenu } from "./MobileMenu";
import { SearchDialog } from "@/components/search/SearchDialog/SearchDialog";
import { CartSheet } from "@/components/cart/CartSheet/CartSheet";
import { CheckoutHeader } from "@/components/checkout/CheckoutFrame";

const navLink = cn(
  "indicator-bar label-caps relative inline-flex h-full items-center whitespace-nowrap text-[0.9375rem] text-ink-muted transition-colors duration-[140ms]",
  "after:!bottom-[calc(50%-14px)] hover-device:hover:text-ink aria-[current]:text-ink data-[active=true]:text-ink",
);

const action = "relative inline-flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-control px-2 text-ui-md font-semibold text-ink transition-colors duration-[140ms] hover-device:hover:bg-raised";

export function CartCount({ count, bump }: { count: number; bump: number }) {
  if (count <= 0) return null;
  return (
    <span data-cart-count="" className="inline-flex h-5 min-w-5 items-center justify-center overflow-hidden rounded-control bg-brand px-1 font-mono text-[0.6875rem] font-semibold leading-none text-on-brand">
      <span key={bump} className={cn("inline-block", bump > 0 && "animate-count-roll")}>
        {count > 99 ? "99+" : count}
      </span>
    </span>
  );
}

function CatalogFilterProbe({ onChange }: { onChange: (slug: string | null) => void }) {
  const params = useSearchParams();
  const types = (params.get("type") ?? "").split(",").filter(Boolean);
  const weapons = (params.get("weapon") ?? "").split(",").filter(Boolean);
  const slug = types.length === 1 ? types[0] : types.length === 0 && weapons.length === 1 ? weapons[0] : null;
  useEffect(() => onChange(slug), [slug, onChange]);
  return null;
}

function StoreHeader() {
  const pathname = usePathname();
  const [filterSlug, setFilterSlug] = useState<string | null>(null);
  const { itemCount, cartBounce, openSheet, isSheetOpen } = useCart();
  const { user } = useAuth();
  const steam = useSteamAccount(Boolean(user));
  const categories = useCategoryTree();
  const boardId = useId();
  const [boardOpen, setBoardOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const boardTimer = useRef<number | undefined>(undefined);
  const boardTrigger = useRef<HTMLButtonElement>(null);
  const anyOpen = boardOpen || mobileOpen || searchOpen || isSheetOpen;

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setBoardOpen(false);
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

  const openBoard = useCallback((delay: number) => {
    window.clearTimeout(boardTimer.current);
    boardTimer.current = window.setTimeout(() => setBoardOpen(true), delay);
  }, []);

  const closeBoard = useCallback((delay: number, restoreFocus = false) => {
    window.clearTimeout(boardTimer.current);
    boardTimer.current = window.setTimeout(() => {
      setBoardOpen(false);
      if (restoreFocus) boardTrigger.current?.focus();
    }, delay);
  }, []);

  useEffect(() => {
    if (!boardOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeBoard(0, true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [boardOpen, closeBoard]);

  const catalogSlug = catalogSlugFromPath(pathname);
  const filteredSlug = pathname === "/catalog" ? filterSlug : null;
  const activeRoot = findRootSlug(categories, catalogSlug ?? filteredSlug) ?? catalogSlug ?? filteredSlug;
  const boardActive = (pathname === "/catalog" && !filteredSlug) || (activeRoot !== null && !RIG_LINKS.includes(activeRoot));
  const persona = steam.steam?.personaName ?? user?.firstName ?? user?.name ?? null;
  const avatar = steam.steam?.avatar ?? null;

  return (
    <>
      <Suspense fallback={null}>
        <CatalogFilterProbe onChange={setFilterSlug} />
      </Suspense>
      <div aria-hidden="true" className="h-[var(--header-height-mobile)] shrink-0 lg:h-[var(--header-height)]" />
      <header
        data-header=""
        data-header-state={compact ? "compact" : "top"}
        data-print-hide=""
        onPointerLeave={() => {
          if (boardOpen) closeBoard(250);
        }}
        className="fixed inset-x-0 top-0 z-40"
      >
        <div
          data-rig=""
          className={cn(
            "relative border-b border-line bg-rig text-ink transition-[height] duration-[200ms] ease-[var(--ease-instrument)]",
            "h-[var(--header-height-mobile)]",
            compact ? "lg:h-[var(--header-height-compact)]" : "lg:h-[var(--header-height)]",
          )}
        >
          <div className="mx-auto flex h-full max-w-container items-center justify-between gap-4 px-gutter xl:gap-6">
            <Link href="/" aria-label={`${BRAND.name}, home`} className="flex shrink-0 items-center text-ink">
              <Wordmark className="h-[22px] w-auto lg:h-[26px]" />
            </Link>

            <nav aria-label="Main" className="hidden h-full min-w-0 items-center gap-5 lg:flex 2xl:gap-6">
              {RIG_LINKS.map((slug) => {
                const cat = navCategory(slug);
                const current = catalogSlug === slug ? "page" : activeRoot === slug ? "true" : undefined;
                return (
                  <Link key={slug} href={`/catalog/${slug}`} aria-current={current} className={cn(navLink, "hidden xl:inline-flex")}>
                    {cat?.short ?? slug}
                  </Link>
                );
              })}
              <button
                ref={boardTrigger}
                type="button"
                data-board-trigger=""
                data-active={boardActive || undefined}
                aria-expanded={boardOpen}
                aria-controls={boardId}
                onClick={() => {
                  window.clearTimeout(boardTimer.current);
                  setBoardOpen((v) => !v);
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") openBoard(150);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse" && !boardOpen) window.clearTimeout(boardTimer.current);
                }}
                className={cn(navLink, "cursor-pointer gap-1", boardOpen && "text-ink")}
              >
                <span className="xl:hidden">Skins</span>
                <span className="hidden xl:inline">All skins</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
            </nav>

            <div className="flex items-center gap-1 lg:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden h-9 w-[200px] cursor-pointer items-center gap-2 rounded-control border border-control bg-raised px-3 text-left text-ui-md text-ink-subtle shadow-lamp-catch transition-colors duration-[140ms] hover-device:hover:border-ink-muted lg:flex 2xl:w-[240px]"
              >
                <Search size={16} aria-hidden="true" className="text-ink-muted" />
                <span className="flex-1">Search skins</span>
                <kbd className="rounded-[1px] border border-line px-1.5 font-mono text-[0.6875rem] leading-[1.3] text-ink-muted">/</kbd>
              </button>
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className={cn(action, "w-11 justify-center px-0 lg:hidden")}>
                <Search size={20} aria-hidden="true" />
              </button>
              <CurrencySelect className="hidden lg:flex" />
              <ThemeToggle className="hidden lg:flex" />
              <Link href={user ? "/account" : "/auth/login"} className={cn(action, "hidden lg:inline-flex")} aria-label={user ? `Account${persona ? `, ${persona}` : ""}` : "Sign in"}>
                {user && avatar ? (
                  <Image src={avatar} alt="" width={24} height={24} unoptimized className="size-6 rounded-control" />
                ) : (
                  <CircleUser size={20} aria-hidden="true" />
                )}
                <span className="hidden max-w-[14ch] truncate 2xl:inline">{user ? persona ?? "Account" : "Sign in"}</span>
              </Link>
              <button
                type="button"
                onClick={openSheet}
                aria-label={`Cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
                data-cart-target=""
                className={cn(action, "-mr-2 min-w-11 justify-center lg:mr-0")}
              >
                <ShoppingCart size={20} aria-hidden="true" />
                <span className="hidden lg:inline">Cart</span>
                <CartCount count={itemCount} bump={cartBounce} />
              </button>
              <button type="button" onClick={() => setMobileOpen(true)} aria-label="Menu" className={cn(action, "-mr-2 w-11 justify-center px-0 lg:hidden")}>
                <AlignRight size={20} aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <LoadoutBoard
              id={boardId}
              open={boardOpen}
              categories={categories}
              activeSlug={catalogSlug}
              onClose={(restore) => closeBoard(0, restore)}
              onPointerEnter={() => window.clearTimeout(boardTimer.current)}
              onPointerLeave={() => closeBoard(250)}
            />
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} categories={categories} activeSlug={catalogSlug} activeRoot={activeRoot} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} categories={categories} />
      <CartSheet />
    </>
  );
}

export function Header() {
  const pathname = usePathname();
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return <CheckoutHeader />;
  return <StoreHeader />;
}
