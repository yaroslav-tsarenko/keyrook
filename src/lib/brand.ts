export const BRAND = {
  name: "Keyrook",
  domain: "keyrook.com",
  tagline: "Game keys, DLC, subscriptions and gift cards, delivered to your account",
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || `https://${BRAND.domain}`).replace(/\/+$/, "");
export const COMPANY_REGISTERED = true;

export function getBaseUrl(): string {
  return (process.env.APP_URL?.trim() || SITE_URL).replace(/\/+$/, "");
}
