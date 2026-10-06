"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Currency = "USD" | "EUR" | "GBP";

export const BASE_CURRENCY: Currency = "USD";

const CURRENCY_LIST: Currency[] = ["USD", "EUR", "GBP"];

interface Rates {
  USD: number;
  EUR: number;
  GBP: number;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convert: (amountInBase: number) => number;
  rates: Rates;
}

const DEFAULT_RATES: Rates = { USD: 1, EUR: 0.86, GBP: 0.75 };

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(BASE_CURRENCY);
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("currency") as Currency | null;
      if (stored && CURRENCY_LIST.includes(stored)) setCurrencyState(stored);
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/exchange-rates")
      .then((r) => r.json())
      .then((data) => {
        if (data.rates?.EUR && data.rates?.GBP) setRates({ USD: 1, EUR: data.rates.EUR, GBP: data.rates.GBP });
      })
      .catch(() => {});
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem("currency", c);
    } catch {}
  };

  const convert = useCallback(
    (amountInBase: number) => {
      if (currency === BASE_CURRENCY) return amountInBase;
      return Math.round(amountInBase * rates[currency] * 100) / 100;
    },
    [currency, rates],
  );

  return <CurrencyContext.Provider value={{ currency, setCurrency, convert, rates }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
