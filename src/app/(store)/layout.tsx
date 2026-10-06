import { NextIntlClientProvider } from "next-intl";
import { LocaleSync } from "@/providers/LocaleSync";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import { CurrencyProvider } from "@/providers/CurrencyProvider";
import { WishlistProvider } from "@/providers/WishlistProvider";
import { ToastProvider } from "@/providers/ToastProvider";
import { Header } from "@/components/layout/Header/Header";
import { Footer } from "@/components/layout/Footer/Footer";
import { CookieConsent } from "@/components/consent/CookieConsent";
import { MotionRoot } from "@/components/motion/MotionRoot";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider>
      <LocaleSync />
      <ThemeProvider>
        <AuthProvider>
          <CurrencyProvider>
            <CartProvider>
              <WishlistProvider>
                <div className="flex min-h-screen flex-col">
                  <a
                    href="#main"
                    className="sr-only z-90 bg-brand px-4 py-3 text-ui-md font-semibold text-on-brand focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
                  >
                    Skip to content
                  </a>
                  <Header />
                  <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
                    {children}
                  </main>
                  <Footer />
                </div>
                <CookieConsent />
                <ToastProvider />
                <MotionRoot />
              </WishlistProvider>
            </CartProvider>
          </CurrencyProvider>
        </AuthProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
