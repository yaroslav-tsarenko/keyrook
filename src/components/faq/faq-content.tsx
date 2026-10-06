import Link from "next/link";
import type { ReactNode } from "react";
import { POLICY_FACTS as F } from "@/lib/policy-facts";

export const FAQ_GROUPS: { id: string; items: string[] }[] = [
  { id: "orders", items: ["place", "account", "unique", "float", "change", "noEmail"] },
  { id: "delivery", items: ["how", "time", "requirements", "protection", "expired", "safety"] },
  { id: "returns", items: ["when", "withdrawal", "refund", "account"] },
  { id: "payment", items: ["methods", "safe", "currencies", F.vatRegistered ? "vatYes" : "vatNo", "when"] },
  { id: "items", items: ["what", "store", "rarity", "affiliation"] },
  { id: "account", items: ["who", "steam", "password", "delete"] },
];

export const FAQ_VALUES = {
  brand: F.brand,
  company: F.company,
  email: F.email,
  withdrawalDays: F.withdrawalDays,
  refundDays: F.refundDays,
  refundMethod: F.refundMethod,
  maxItems: F.maxItemsPerOrder,
  restricted: F.restrictedCountries,
  method: F.deliveryMethod,
  usual: F.deliveryUsual,
  deadlineHours: F.deliveryDeadlineHours,
  protectionDays: F.tradeProtectionDays,
  holdDays: F.tradeHoldMaxDays,
  cancelBefore: F.cancelBefore,
  cardMethods: F.cardMethods,
  currencies: F.currencies,
  minAge: F.minAge,
  replyTime: F.replyTime,
  supportHours: F.supportHours,
};

export const faqLinkTags = {
  returns: (chunks: ReactNode) => <Link href="/policies/returns">{chunks}</Link>,
  warranty: (chunks: ReactNode) => <Link href="/policies/warranty">{chunks}</Link>,
  privacy: (chunks: ReactNode) => <Link href="/policies/privacy">{chunks}</Link>,
  policies: (chunks: ReactNode) => <Link href="/policies">{chunks}</Link>,
};

export const faqPlainTags = {
  returns: (chunks: string) => chunks,
  warranty: (chunks: string) => chunks,
  privacy: (chunks: string) => chunks,
  policies: (chunks: string) => chunks,
};
