import {
  isLocale,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "./config";

export function readStoredLocale(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {}
}

export function readLocaleCookie(): string | null {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LOCALE_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(LOCALE_COOKIE.length + 1)) : null;
}

export function writeLocaleCookie(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function setLocale(locale: Locale, router: { refresh: () => void }) {
  storeLocale(locale);
  writeLocaleCookie(locale);
  router.refresh();
}
