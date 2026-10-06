import type { Metadata, Viewport } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { preload } from "react-dom";
import "@fontsource-variable/mona-sans/wght.css";
import "@fontsource-variable/red-hat-mono/wght.css";
import "./fonts.css";
import "@/styles/globals.css";
import { BRAND, SITE_URL } from "@/lib/brand";
import { ThemeScript } from "@/components/layout/ThemeScript/ThemeScript";
import { defaultLocale, isLocale, localeTags } from "@/i18n/config";
import { DEFAULT_OG_IMAGE, ogLocale } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/url";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: defaultLocale, namespace: "seo" });
  const title = `${BRAND.name} · ${BRAND.tagline}`;
  const description = t("siteDescription");
  return {
    title: { default: title, template: `%s · ${BRAND.name}` },
    description,
    metadataBase: new URL(SITE_URL),
    applicationName: BRAND.name,
    category: "shopping",
    manifest: "/manifest.json",
    formatDetection: { telephone: false, email: false, address: false },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      siteName: BRAND.name,
      title,
      description,
      locale: ogLocale(defaultLocale),
      url: SITE_URL,
      images: [{ ...DEFAULT_OG_IMAGE, url: absoluteUrl(DEFAULT_OG_IMAGE.url) }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7F5" },
    { media: "(prefers-color-scheme: dark)", color: "#0C110F" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  preload("/fonts/hubot-sans-latin-wdth-normal.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });

  return (
    <html
      lang={localeTags[isLocale(locale) ? locale : defaultLocale].html}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <ThemeScript />
        {children}
      </body>
    </html>
  );
}
