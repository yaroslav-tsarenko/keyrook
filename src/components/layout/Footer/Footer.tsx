"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckoutFooter } from "@/components/checkout/CheckoutFrame";
import { BRAND } from "@/lib/brand";
import { HELP_LINKS, NAV_CATEGORIES, ORDER_LINKS, POLICY_LINKS } from "@/config/navigation";
import { openCookieSettings } from "@/lib/consent";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { CalibratedRuler } from "@/components/skin/FloatRuler";
import { CredentialsSheet } from "@/components/layout/Credentials/CredentialsSheet";

const linkCls = "text-ui-md text-ink decoration-1 underline-offset-4 hover-device:hover:underline";

const SOCIAL = [
  { label: "Instagram", href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: "LinkedIn", href: process.env.NEXT_PUBLIC_LINKEDIN_URL },
  { label: "Facebook", href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
].filter((s): s is { label: string; href: string } => Boolean(s.href));

function LinkList({ links, children }: { links: { href: string; label: string }[]; children?: React.ReactNode }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={linkCls}>
            {link.label}
          </Link>
        </li>
      ))}
      {children}
    </ul>
  );
}

const COLUMNS = [
  { title: "Skins", links: [...NAV_CATEGORIES.map((c) => ({ href: `/catalog/${c.slug}`, label: c.name })), { href: "/catalog", label: "All skins" }] },
  { title: "Orders", links: ORDER_LINKS },
  { title: "Help", links: HELP_LINKS },
  { title: "Legal", links: POLICY_LINKS },
];

function CookieButton() {
  return (
    <li>
      <button type="button" onClick={openCookieSettings} className={`${linkCls} cursor-pointer text-left`}>
        Cookie settings
      </button>
    </li>
  );
}

function StoreFooter() {
  const year = new Date().getFullYear();

  return (
    <footer data-print-hide="" data-floor="" className="mt-auto bg-floor text-ink">
      <div className="mx-auto max-w-wide px-gutter">
        <div aria-hidden="true" className="pt-4">
          <CalibratedRuler decorative labels={false} />
        </div>

        <nav aria-label="Footer" className="mt-14 hidden grid-cols-4 lg:grid">
          {COLUMNS.map((col, i) => (
            <div key={col.title} className={i === 0 ? "pr-10" : "border-l border-line px-10"}>
              <h2 className="eyebrow m-0 mb-5">{col.title}</h2>
              <LinkList links={col.links}>{col.title === "Legal" ? <CookieButton /> : null}</LinkList>
            </div>
          ))}
        </nav>

        <nav aria-label="Footer" className="mt-8 lg:hidden">
          <Accordion>
            {COLUMNS.map((col) => (
              <AccordionItem key={col.title} title={col.title} headingLevel={2} flush titleClassName="text-step-0">
                <LinkList links={col.links}>{col.title === "Legal" ? <CookieButton /> : null}</LinkList>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>

        <CredentialsSheet className="mt-12 lg:mt-16" />

        <p className="m-0 mt-6 max-w-[80ch] text-ui-sm text-ink-muted">
          {BRAND.name} is not affiliated with or endorsed by Valve Corporation. Counter-Strike, Steam and the Steam logo are trademarks of Valve Corporation.
        </p>

        <div className="mt-8 flex flex-col items-center gap-5 border-t border-line py-6 lg:flex-row lg:justify-between">
          <p className="order-last m-0 text-ui-sm text-ink-muted lg:order-first">
            © {year} {BRAND.name}
          </p>
          {SOCIAL.length > 0 ? (
            <ul className="m-0 flex list-none gap-6 p-0">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className={linkCls}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <PaymentLogos height={28} className="max-lg:hidden" />
          <PaymentLogos height={24} className="justify-center lg:hidden" />
        </div>
      </div>
    </footer>
  );
}

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return <CheckoutFooter />;
  return <StoreFooter />;
}
