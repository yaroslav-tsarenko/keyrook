import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { defaultLocale, isLocale, localeTags } from "@/i18n/config";
import { clampText } from "@/lib/utils/sanitize-html";
import { absoluteUrl } from "./url";

export const META_DESCRIPTION_MAX = 160;

export interface SeoImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface PageSeo {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  canonical?: boolean;
  images?: SeoImage[] | false;
  type?: "website" | "article";
  index?: boolean;
  follow?: boolean;
  locale?: string;
}

export const DEFAULT_OG_IMAGE: SeoImage = { url: "/opengraph-image", width: 1200, height: 630, alt: `${BRAND.name}: ${BRAND.tagline}` };

const INDEXABLE_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
};

export function ogLocale(locale?: string): string {
  return localeTags[isLocale(locale) ? locale : defaultLocale].og;
}

export function metaDescription(text: string): string {
  return clampText(text.replace(/\s+/g, " ").trim(), META_DESCRIPTION_MAX);
}

export function pagedDescription(description: string, page: number, format: (description: string, page: number) => string): string {
  if (page <= 1) return metaDescription(description);
  const room = META_DESCRIPTION_MAX - format("", page).length;
  return format(clampText(description.replace(/\s+/g, " ").trim(), room), page);
}

export function pageMetadata(seo: PageSeo): Metadata {
  const url = absoluteUrl(seo.path);
  const description = metaDescription(seo.description);
  const source = seo.images === false ? [] : seo.images?.length ? seo.images : [DEFAULT_OG_IMAGE];
  const images = source.length ? source.map((image) => ({ ...image, url: absoluteUrl(image.url) })) : undefined;
  const indexable = seo.index !== false;
  return {
    title: seo.absoluteTitle ? { absolute: seo.title } : seo.title,
    description,
    ...(seo.canonical === false ? {} : { alternates: { canonical: url } }),
    openGraph: {
      type: seo.type ?? "website",
      url,
      siteName: BRAND.name,
      locale: ogLocale(seo.locale),
      title: seo.title,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description,
      ...(images ? { images: images.map((image) => ({ url: image.url, alt: image.alt })) } : {}),
    },
    robots: indexable ? INDEXABLE_ROBOTS : { index: false, follow: seo.follow ?? true },
  };
}

export function noindexMetadata(title: string, description: string, path: string, follow = true): Metadata {
  return pageMetadata({ title, description, path, index: false, follow, canonical: false });
}
