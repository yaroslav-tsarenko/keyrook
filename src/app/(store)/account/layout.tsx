"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import { AccountSidebar } from "@/components/account/AccountSidebar/AccountSidebar";
import { ReadoutLoader } from "@/components/ui/ReadoutLoader";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs/Breadcrumbs";

const CRUMB: Record<string, string> = {
  "/account/orders": "orders",
  "/account/steam": "steam",
  "/account/wishlist": "saved",
  "/account/addresses": "addresses",
  "/account/profile": "profile",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const nav = useTranslations("nav");
  const t = useTranslations("account.nav");

  useEffect(() => {
    if (!loading && !user) {
      window.location.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, pathname]);

  if (loading || !user) return <ReadoutLoader block label={t("loading")} />;

  const section = Object.keys(CRUMB).find((href) => pathname === href || pathname.startsWith(`${href}/`));
  const crumbs = [
    { label: nav("home"), href: "/" },
    { label: t("account"), href: section ? "/account" : undefined },
    ...(section ? [{ label: t(CRUMB[section]), href: pathname !== section ? section : undefined }] : []),
  ];

  return (
    <div className="mx-auto max-w-narrow px-gutter pb-24">
      <Breadcrumbs items={crumbs} withJsonLd={false} />
      <div className="grid grid-cols-1 items-start gap-8 pt-2 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
        <div className="hidden lg:sticky lg:top-[calc(var(--header-height-compact)+24px)] lg:block">
          <AccountSidebar />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
