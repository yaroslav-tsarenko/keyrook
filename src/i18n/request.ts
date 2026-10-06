import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, hasMultipleLocales, isLocale, LOCALE_COOKIE } from "./config";
import { loadMessages } from "./messages";

async function resolveLocale(requested: string | undefined) {
  if (isLocale(requested)) return requested;
  if (!hasMultipleLocales) return defaultLocale;
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(stored) ? stored : defaultLocale;
}

export default getRequestConfig(async ({ locale: requested }) => {
  const locale = await resolveLocale(requested);

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
