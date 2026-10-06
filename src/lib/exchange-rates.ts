import { STORE_POLICY } from "@/config/store-policy";

export type SupportedCurrency = (typeof STORE_POLICY.supportedCurrencies)[number];

export type Rates = Record<SupportedCurrency, number>;

const FALLBACK_RATES: Rates = { USD: 1, EUR: 0.86, GBP: 0.75 };
const CACHE_MS = 60 * 60 * 1000;

let cached: { rates: Rates; at: number } | null = null;

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === "string" && (STORE_POLICY.supportedCurrencies as readonly string[]).includes(value);
}

export async function getExchangeRates(): Promise<Rates> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.rates;
  try {
    const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${STORE_POLICY.currency}&symbols=EUR,GBP`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`rates ${res.status}`);
    const data = (await res.json()) as { rates?: { EUR?: number; GBP?: number } };
    if (!data.rates?.EUR || !data.rates?.GBP) throw new Error("rates payload");
    cached = { rates: { USD: 1, EUR: data.rates.EUR, GBP: data.rates.GBP }, at: Date.now() };
    return cached.rates;
  } catch {
    return cached?.rates ?? FALLBACK_RATES;
  }
}

export async function getRate(currency: SupportedCurrency): Promise<number> {
  if (currency === STORE_POLICY.currency) return 1;
  const rates = await getExchangeRates();
  return rates[currency];
}
