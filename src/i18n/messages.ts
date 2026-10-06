export const MESSAGE_NAMESPACES = [
  "common",
  "nav",
  "home",
  "product",
  "cart",
  "checkout",
  "account",
  "auth",
  "admin",
  "footer",
  "contact",
  "errors",
  "notifications",
  "policies",
  "faq",
  "catalog",
  "forms",
  "about",
  "seo",
] as const;

export async function loadMessages(locale: string) {
  const entries = await Promise.all(
    MESSAGE_NAMESPACES.map(async (ns) => {
      const mod = await import(`../../messages/${locale}/${ns}.json`).catch(() => ({ default: {} }));
      return [ns, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries);
}
