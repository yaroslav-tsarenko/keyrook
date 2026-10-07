import { COMPANY } from "@/lib/company";

const POLICY_DATE = "2026-10-06";

export type LimitedType = "game" | "dlc" | "subscription" | "gift-card" | "top-up" | "software";

export const STORE_POLICY = {
  currency: "EUR",
  supportedCurrencies: ["EUR", "USD", "GBP"],
  vatRegistered: COMPANY.vatRegistered,
  tax: {
    vatRatePercent: 20,
    pricesIncludeVat: true,
  },
  markets: {
    countries: ["United Kingdom", "European Union member states"],
  },
  delivery: {
    method: "Activation key in your account",
    usualTime: "usually within minutes after your payment is confirmed",
    headline: "Delivered to your account, usually within minutes after payment is confirmed.",
    short: "To your account, usually within minutes after payment is confirmed",
    rail: "Delivery: usually within minutes",
    deadlineHours: 24,
    where: "on the order page in your account, behind a Reveal key button",
    emailNote: "We email you when your keys are ready. For security the email links to your account and does not contain the key itself.",
  },
  returns: {
    withdrawalDays: 14,
    refundDays: 14,
    refundMethod: "the original payment method",
  },
  guarantee: {
    claimDays: 30,
    reviewDays: 3,
    summary: "If a key does not activate, contact us within 30 days of delivery. We check it and replace the key, or refund the price you paid for it if no replacement is available.",
    headline: "Replacement or refund if a key doesn't work",
    faultyKey: true,
    steps: [
      "Check that the product's platform, activation region and account requirements match your account.",
      "Contact us within 30 days of delivery with your order number and a screenshot of the activation error.",
      "We check the key with our distribution partner within 3 business days.",
      "If the key is faulty, already used before you received it, or does not match the product page, we send a replacement key or refund the price you paid for it.",
    ],
    exclusions: [
      "keys you have already activated successfully",
      "keys bought for the wrong platform or region when the product page stated them correctly",
      "accounts that are banned or restricted by the platform for reasons unrelated to the key",
    ],
  },
  limits: {
    maxQtyPerItem: 5,
    maxItemsPerOrder: 10,
    maxOrderValue: 600,
    byType: {
      game: { perItem: 5 },
      dlc: { perItem: 5 },
      software: { perItem: 3 },
      subscription: { perItem: 2 },
      "gift-card": { perItem: 2 },
      "top-up": { perItem: 2 },
    } as Record<LimitedType, { perItem: number }>,
    perCustomer24h: {
      "gift-card": { units: 4, value: 200 },
      "top-up": { units: 4, value: 200 },
    } as Partial<Record<LimitedType, { units: number; value: number }>>,
  },
  minAge: 18,
  policiesLastUpdated: POLICY_DATE,
  waiver: {
    version: POLICY_DATE,
    text: "I ask for my keys to be delivered straight after payment and I understand I lose my right to cancel once a key is delivered.",
  },
  support: {
    replyTime: "within 1 business day",
    channels: ["email", "contact form"],
  },
  payment: {
    hostedPage: true,
    threeDSecure: true,
    methods: ["Visa", "Mastercard"],
    providerName: null as string | null,
    chargeCurrencies: ["EUR", "USD", "GBP"],
  },
  orders: {
    cancelBefore: "your key is issued",
  },
  security: {
    keysEncryptedAtRest: true,
    keyInEmail: false,
  },
  invoices: {
    pdf: true,
  },
  checkout: {
    requireRegionCheck: true,
  },
  deals: {
    compareWindowDays: 30,
    minPercent: 10,
  },
  preorders: false,
  complaints: {
    acknowledgeTime: "within 1 business day",
    responseDays: 14,
  },
  processors: [
    { role: "Card payments", purpose: "Takes card payments on its own hosted page and runs 3-D Secure checks", name: null as string | null },
    { role: "Key distribution partner", purpose: "Issues the activation keys you buy. It receives the product and quantity, never your name, email or card details", name: null as string | null },
    { role: "Website hosting and database", purpose: "Runs the store and stores account and order records, including your keys in encrypted form", name: null as string | null },
    { role: "Email delivery", purpose: "Sends order, account and support emails", name: null as string | null },
  ],
  retention: {
    orderRecordsYears: 6,
    supportMessagesMonths: 24,
    inactiveAccountYears: 3,
  },
} as const;

export function perItemLimit(productType: string | null | undefined): number {
  const byType = STORE_POLICY.limits.byType as Record<string, { perItem: number }>;
  return productType && byType[productType] ? byType[productType].perItem : STORE_POLICY.limits.maxQtyPerItem;
}
