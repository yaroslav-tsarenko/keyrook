export const BRAND = {
  name: "Patinaskins",
  domain: "patinaskins.com",
  tagline: "Counter-Strike 2 skins, delivered by Steam trade offer",
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || `https://${BRAND.domain}`).replace(/\/+$/, "");
export const COMPANY_REGISTERED = true;
