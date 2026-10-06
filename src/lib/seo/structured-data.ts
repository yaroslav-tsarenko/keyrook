import { BRAND, SITE_URL } from "@/lib/brand";
import { COMPANY } from "@/lib/company";
import { defaultLocale, localeTags } from "@/i18n/config";
import { absoluteUrl } from "./url";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

const SOCIAL_PROFILES = [process.env.NEXT_PUBLIC_INSTAGRAM_URL, process.env.NEXT_PUBLIC_LINKEDIN_URL].filter((url): url is string => Boolean(url));

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": ORGANIZATION_ID,
    name: BRAND.name,
    legalName: COMPANY.name,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: absoluteUrl("/android-chrome-512x512.png"), width: 512, height: 512 },
    image: absoluteUrl("/opengraph-image"),
    email: COMPANY.email,
    ...(COMPANY.phone ? { telephone: COMPANY.phone } : {}),
    address: { "@type": "PostalAddress", streetAddress: COMPANY.addressLine, addressCountry: COMPANY.country },
    ...(COMPANY.companyNumber ? { identifier: COMPANY.companyNumber } : {}),
    ...(COMPANY.vatRegistered && COMPANY.vatNumber ? { vatID: COMPANY.vatNumber } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: COMPANY.email,
      ...(COMPANY.phone ? { telephone: COMPANY.phone } : {}),
      availableLanguage: ["en"],
      url: absoluteUrl("/contact"),
    },
    ...(SOCIAL_PROFILES.length ? { sameAs: SOCIAL_PROFILES } : {}),
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: BRAND.name,
    url: SITE_URL,
    inLanguage: localeTags[defaultLocale].html,
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}
