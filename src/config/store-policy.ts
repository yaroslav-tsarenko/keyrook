import { COMPANY } from "@/lib/company";

const POLICY_DATE = "2026-10-06";

export const STORE_POLICY = {
  currency: "USD",
  supportedCurrencies: ["USD", "EUR", "GBP"],
  vatRegistered: COMPANY.vatRegistered,
  tax: {
    vatRatePercent: 20,
    pricesIncludeVat: true,
  },
  markets: {
    countries: ["United Kingdom", "European Union member states"],
  },
  delivery: {
    method: "Steam trade offer",
    game: "Counter-Strike 2",
    usualTime: "usually within minutes of payment confirmation",
    deadlineHours: 24,
    offerExpiryNote: "Each trade offer has an expiry time. It is shown on the offer in Steam and on your order page.",
    tradeProtectionDays: 7,
    tradeHoldMaxDays: 15,
    requirements: [
      "a Steam account in good standing, with no trade ban or trade cooldown",
      "Steam Guard Mobile Authenticator turned on for at least 7 days",
      "a public Steam inventory",
      "a current Steam trade URL saved in your account",
    ],
  },
  returns: {
    withdrawalDays: 14,
    refundDays: 14,
    refundMethod: "the original payment method",
  },
  guarantee: {
    summary: "If we cannot deliver an item you paid for, or Steam reverses the trade while the item is under Steam trade protection, we refund the full price you paid for that item.",
  },
  limits: {
    maxQtyPerItem: 1,
    maxItemsPerOrder: 10,
  },
  minAge: 18,
  policiesLastUpdated: POLICY_DATE,
  waiver: {
    version: POLICY_DATE,
    text: "I ask you to start delivery straight after payment and I understand I lose my right to cancel once the trade offer is sent.",
  },
  support: {
    replyTime: "within 1 business day",
    channels: ["email", "contact form"],
  },
  payment: {
    methods: ["Visa", "Mastercard"],
    providerName: null as string | null,
    chargeCurrencies: ["USD", "EUR", "GBP"],
  },
  orders: {
    cancelBefore: "we send the Steam trade offer",
  },
  complaints: {
    acknowledgeTime: "within 1 business day",
    responseDays: 14,
  },
  processors: [
    { role: "Card payments", purpose: "Takes card payments on its own hosted page and runs 3-D Secure checks", name: null as string | null },
    { role: "Item delivery partner", purpose: "Sources the item you bought and sends the Steam trade offer to your account, using your Steam ID and trade URL", name: null as string | null },
    { role: "Steam (Valve Corporation)", purpose: "Signs you in when you choose Steam sign-in and carries the trade offer to your account", name: "Valve Corporation" as string | null },
    { role: "Website hosting and database", purpose: "Runs the store and stores account and order records", name: null as string | null },
    { role: "Email delivery", purpose: "Sends order, account and support emails", name: null as string | null },
  ],
  retention: {
    orderRecordsYears: 6,
    supportMessagesMonths: 24,
    inactiveAccountYears: 3,
  },
} as const;
