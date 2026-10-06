import { PLATFORMS, PRODUCT_TYPES } from "@/lib/keys/taxonomy";

export interface NavCategory {
  slug: string;
  name: string;
  short: string;
}

export const NAV_CATEGORIES: NavCategory[] = PRODUCT_TYPES.map((t) => ({ slug: t.slug, name: t.label, short: t.key === "dlc" ? "DLC" : t.label }));

export const RIG_LINKS = ["games", "dlc", "subscriptions", "gift-cards"];

export const BOARD_COLUMNS: { title: string; slugs: string[]; wide?: boolean }[] = [
  { title: "Games", slugs: ["games"], wide: true },
  { title: "DLC", slugs: ["dlc"] },
  { title: "Subscriptions", slugs: ["subscriptions"] },
  { title: "Gift cards", slugs: ["gift-cards"] },
  { title: "Top-ups", slugs: ["top-ups"] },
  { title: "Software", slugs: ["software"] },
];

export const PLATFORM_LINKS = PLATFORMS.filter((p) => p.key !== "other").map((p) => ({ href: `/platform/${p.slug}`, label: p.label }));

export function navCategory(slug: string): NavCategory | undefined {
  return NAV_CATEGORIES.find((c) => c.slug === slug);
}

export const ORDER_LINKS: { href: string; label: string }[] = [
  { href: "/how-it-works", label: "How delivery works" },
  { href: "/account/orders", label: "My orders and keys" },
  { href: "/cart", label: "Cart" },
];

export const HELP_LINKS: { href: string; label: string }[] = [
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact us" },
  { href: "/policies/shipping", label: "Delivery policy" },
  { href: "/policies/returns", label: "Refunds" },
  { href: "/policies/warranty", label: "Key guarantee" },
  { href: "/policies/payment", label: "Payment" },
  { href: "/policies/complaints", label: "Complaints" },
];

export const POLICY_LINKS = [
  { href: "/policies/terms", label: "Terms & conditions" },
  { href: "/policies/privacy", label: "Privacy policy" },
  { href: "/policies/cookies", label: "Cookie policy" },
  { href: "/policies/acceptable-use", label: "Acceptable use" },
  { href: "/policies", label: "All policies" },
];
