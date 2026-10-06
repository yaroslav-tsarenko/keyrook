import { WEAPON_TYPES } from "@/lib/skins/cs2";

export interface NavCategory {
  slug: string;
  name: string;
  short: string;
}

export const NAV_CATEGORIES: NavCategory[] = WEAPON_TYPES.map((t) => ({ slug: t.key, name: t.label, short: t.label }));

export const RIG_LINKS = ["knives", "gloves", "rifles", "sniper-rifles", "pistols", "smgs"];

export const BOARD_COLUMNS: { title: string; slugs: string[]; wide?: boolean }[] = [
  { title: "Knives", slugs: ["knives"], wide: true },
  { title: "Gloves", slugs: ["gloves"] },
  { title: "Rifles", slugs: ["rifles", "sniper-rifles"] },
  { title: "Pistols", slugs: ["pistols"] },
  { title: "SMGs", slugs: ["smgs"] },
  { title: "Heavy", slugs: ["shotguns", "machine-guns"] },
];

export function navCategory(slug: string): NavCategory | undefined {
  return NAV_CATEGORIES.find((c) => c.slug === slug);
}

export const ORDER_LINKS: { href: string; label: string }[] = [
  { href: "/how-it-works", label: "How delivery works" },
  { href: "/account/orders", label: "My purchases" },
  { href: "/account/steam", label: "Trade URL" },
  { href: "/cart", label: "Cart" },
];

export const HELP_LINKS: { href: string; label: string }[] = [
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact us" },
  { href: "/policies/shipping", label: "Delivery policy" },
  { href: "/policies/returns", label: "Refunds" },
  { href: "/policies/warranty", label: "Item guarantee" },
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
