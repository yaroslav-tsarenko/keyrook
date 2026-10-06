"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckoutFooter } from "@/components/checkout/CheckoutFrame";
import { BRAND } from "@/lib/brand";
import { openCookieSettings } from "@/lib/consent";
import { useStoreIndex } from "@/lib/hooks/useStoreIndex";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { TickBand } from "@/components/ui/Dial";
import { PaymentLogos } from "@/components/shared/PaymentLogos/PaymentLogos";
import { CredentialsSheet } from "@/components/layout/Credentials/CredentialsSheet";

const linkCls = "text-ui-md text-ink decoration-1 underline-offset-4 hover-device:hover:underline";

const SOCIAL = [
  { label: "Instagram", href: process.env.NEXT_PUBLIC_INSTAGRAM_URL },
  { label: "LinkedIn", href: process.env.NEXT_PUBLIC_LINKEDIN_URL },
  { label: "Facebook", href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
].filter((s): s is { label: string; href: string } => Boolean(s.href));

const COLUMNS: { title: string; links: { href: string; label: string }[]; cookie?: boolean }[] = [
  {
    title: "Shop",
    links: [
      { href: "/catalog/games", label: "Games" },
      { href: "/catalog/dlc", label: "DLC" },
      { href: "/catalog/gift-cards", label: "Gift cards" },
      { href: "/catalog/subscriptions", label: "Subscriptions" },
      { href: "/deals", label: "Deals" },
      { href: "/new-releases", label: "New releases" },
      { href: "/catalog", label: "All keys" },
    ],
  },
  {
    title: "Your keys",
    links: [
      { href: "/account", label: "Account" },
      { href: "/account/keys", label: "Keys" },
      { href: "/account/orders", label: "Orders" },
      { href: "/account/wishlist", label: "Pinned" },
      { href: "/cart", label: "Cart" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/how-activation-works", label: "How activation works" },
      { href: "/policies/shipping", label: "Delivery" },
      { href: "/policies/warranty", label: "Key not working?" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/policies/terms", label: "Terms & conditions" },
      { href: "/policies/privacy", label: "Privacy policy" },
      { href: "/policies/returns", label: "Refund policy" },
      { href: "/policies/cookies", label: "Cookie policy" },
      { href: "/policies", label: "All policies" },
    ],
    cookie: true,
  },
];

const DISCLAIMER =
  "Keyrook is an independent store. It is not affiliated with or endorsed by the platforms or publishers of the products it lists. Game titles, platform names and cover art belong to their respective owners.";

function LinkList({ links, cookie }: { links: { href: string; label: string }[]; cookie?: boolean }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={linkCls}>
            {link.label}
          </Link>
        </li>
      ))}
      {cookie ? (
        <li>
          <button type="button" onClick={openCookieSettings} className={`${linkCls} cursor-pointer text-left`}>
            Cookie settings
          </button>
        </li>
      ) : null}
    </ul>
  );
}

function PlatformIndex() {
  const index = useStoreIndex();
  const platforms = index?.platforms ?? [];
  if (!platforms.length) return <div className="h-14" aria-hidden="true" />;
  return (
    <nav aria-label="Platforms" data-platform-index="" className="relative pt-6">
      <ul className="no-scrollbar -mx-gutter m-0 flex list-none gap-x-7 overflow-x-auto px-gutter pb-3 lg:mx-0 lg:flex-wrap lg:justify-between lg:overflow-visible lg:px-0">
        {platforms.map((p) => (
          <li key={p.key} data-platform={p.tone} className="shrink-0">
            <Link href={`/platform/${p.slug}`} className="inline-flex min-h-10 items-center gap-2 underline-offset-4 hover-device:hover:underline">
              <span aria-hidden="true" className="size-1.5 bg-platform" />
              <span className="eyebrow text-ink">{p.short}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="relative h-2">
        <TickBand className="absolute inset-x-0 bottom-px" major={false} tone="faint" />
        <span className="absolute inset-x-0 bottom-0 h-px bg-line" />
      </div>
    </nav>
  );
}

function StoreFooter() {
  const year = new Date().getFullYear();

  return (
    <footer data-print-hide="" data-floor="" className="mt-auto bg-floor text-ink">
      <div className="mx-auto max-w-wide px-gutter">
        <PlatformIndex />

        <nav aria-label="Footer" className="mt-14 hidden grid-cols-4 lg:grid">
          {COLUMNS.map((col, i) => (
            <div key={col.title} className={i === 0 ? "pr-10" : "border-l border-line px-10"}>
              <h2 className="eyebrow m-0 mb-5">{col.title}</h2>
              <LinkList links={col.links} cookie={col.cookie} />
            </div>
          ))}
        </nav>

        <nav aria-label="Footer" className="mt-8 lg:hidden">
          <Accordion>
            {COLUMNS.map((col) => (
              <AccordionItem key={col.title} title={col.title} headingLevel={2} flush titleClassName="text-step-0">
                <LinkList links={col.links} cookie={col.cookie} />
              </AccordionItem>
            ))}
          </Accordion>
        </nav>

        <CredentialsSheet className="mt-12 lg:mt-16" />

        <p className="m-0 mt-6 max-w-[96ch] text-ui-sm text-ink-muted">{DISCLAIMER}</p>

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
          <PaymentLogos height={28} strip className="max-lg:hidden" />
          <PaymentLogos height={24} strip className="justify-center lg:hidden" />
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
