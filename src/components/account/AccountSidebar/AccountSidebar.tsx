"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Lamp } from "@/components/ui/Lamp";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/account", key: "overview" },
  { href: "/account/keys", key: "keys" },
  { href: "/account/orders", key: "orders" },
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
      <ul className="m-0 flex list-none flex-col border-t border-line p-0">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="border-b border-line">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex min-h-11 items-center gap-3 text-step-0 transition-colors duration-[120ms]", active ? "font-[560] text-ink" : "text-ink-muted hover-device:hover:text-ink")}
              >
                <Lamp on={active} />
                {t(item.key)}
              </Link>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={signOut} className="btn-text mt-3 inline-flex min-h-11 cursor-pointer items-center gap-3 text-ui-md text-ink-muted hover-device:hover:text-ink">
        <LogOut size={16} aria-hidden="true" />
        <span data-label="">{t("signOut")}</span>
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
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className={cn("active-bar flex min-h-12 items-center gap-2 whitespace-nowrap text-ui-md", active ? "font-[560] text-ink" : "text-ink-muted")}>
                {active ? <Lamp on /> : null}
                {t(item.key)}
              </Link>
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
    <div className="mb-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="m-0 text-step-5 leading-[1.04] text-ink">{title}</h1>
        {aside}
      </div>
      {children}
      <AccountTabs />
    </div>
  );
}
