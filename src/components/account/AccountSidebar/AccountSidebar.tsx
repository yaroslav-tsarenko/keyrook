"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/account", key: "overview" },
  { href: "/account/orders", key: "orders" },
  { href: "/account/steam", key: "steam" },
  { href: "/account/wishlist", key: "saved" },
  { href: "/account/profile", key: "profile" },
  { href: "/account/addresses", key: "addresses" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/account" ? pathname === "/account" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountSidebar() {
  const pathname = usePathname();
  const t = useTranslations("account.nav");
  const { signOut } = useAuth();

  return (
    <nav aria-label={t("label")} className="hidden lg:block">
      <ul className="m-0 flex list-none flex-col p-0">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 items-center pl-4 text-step-0 transition-colors duration-[140ms]",
                  "before:absolute before:inset-y-2.5 before:left-0 before:w-0.5 before:bg-brand before:opacity-0 aria-[current=page]:before:opacity-100",
                  active ? "font-semibold text-ink" : "text-ink-muted hover-device:hover:text-ink",
                )}
              >
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="my-3 h-px bg-line" />
      <button
        type="button"
        onClick={signOut}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 pl-4 text-ui-md text-ink-muted decoration-1 underline-offset-4 hover-device:hover:text-ink hover-device:hover:underline"
      >
        <LogOut size={16} aria-hidden="true" />
        {t("signOut")}
      </button>
    </nav>
  );
}

export function AccountTabs() {
  const pathname = usePathname();
  const t = useTranslations("account.nav");
  const { signOut } = useAuth();
  return (
    <nav aria-label={t("label")} className="no-scrollbar -mx-gutter overflow-x-auto border-b border-line px-gutter lg:hidden">
      <ul className="m-0 flex w-max list-none gap-6 p-0">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="relative">
              <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("flex min-h-12 items-center whitespace-nowrap text-ui-md", active ? "font-semibold text-ink" : "text-ink-muted")}>
                {t(item.key)}
              </Link>
              {active ? <span aria-hidden="true" className="absolute bottom-0 left-0 h-0.5 w-6 bg-brand" /> : null}
            </li>
          );
        })}
        <li>
          <button type="button" onClick={signOut} className="flex min-h-12 cursor-pointer items-center whitespace-nowrap text-ui-md text-ink-muted">
            {t("signOut")}
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function AccountPageHeader({ title, aside, children }: { title: ReactNode; aside?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="m-0 text-step-5 font-[650] leading-none tracking-[-0.01em] text-ink">{title}</h1>
        {aside}
      </div>
      {children}
      <AccountTabs />
    </div>
  );
}
