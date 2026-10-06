export const locales = ["en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, { native: string; short: string }> = {
  en: { native: "English", short: "EN" },
};

export const localeTags: Record<Locale, { html: string; og: string }> = {
  en: { html: "en-GB", og: "en_GB" },
};

export const LOCALE_STORAGE_KEY = "patina.locale";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const hasMultipleLocales = locales.length > 1;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}
