import { STORE_POLICY } from "@/config/store-policy";

export type Convert = (amountInBase: number) => number;

export interface PricingLine {
  price: number;
  quantity: number;
}

export interface PricedLine {
  unit: number;
  quantity: number;
  total: number;
}

export interface Totals {
  lines: PricedLine[];
  itemCount: number;
  subtotal: number;
  discountPercent: number;
  discount: number;
  shipping: number;
  freeShipping: boolean;
  amountToFreeShipping: number;
  vatRegistered: boolean;
  vatIncluded: boolean;
  vatRatePercent: number;
  vat: number;
  total: number;
}

export interface TotalsOptions {
  convert?: Convert;
  discountPercent?: number;
  shippingBase?: number;
}

export const VAT_REGISTERED: boolean = STORE_POLICY.vatRegistered;

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function rateConverter(rate: number): Convert {
  return (amountInBase: number) => (rate === 1 ? amountInBase : Math.round(amountInBase * rate * 100) / 100);
}

const identity: Convert = (amount) => amount;

export function shippingCostInBase(): number {
  return 0;
}

export function itemQuantityCap(stock?: number | null): number {
  const perItem = STORE_POLICY.limits.maxQtyPerItem;
  if (typeof stock !== "number" || !Number.isFinite(stock)) return perItem;
  return Math.max(0, Math.min(Math.floor(stock), perItem));
}

export function orderQuantityRoom(currentCount: number): number {
  return Math.max(0, STORE_POLICY.limits.maxItemsPerOrder - currentCount);
}

export function computeTotals(lines: PricingLine[], options: TotalsOptions = {}): Totals {
  const convert = options.convert ?? identity;
  const discountPercent = Math.min(100, Math.max(0, options.discountPercent ?? 0));
  const priced = lines.map((line) => {
    const unit = convert(line.price);
    return { unit, quantity: line.quantity, total: roundMoney(unit * line.quantity) };
  });
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = roundMoney(priced.reduce((sum, line) => sum + line.total, 0));
  const discount = roundMoney((subtotal * discountPercent) / 100);
  const shippingBase = options.shippingBase ?? shippingCostInBase();
  const shipping = shippingBase === 0 ? 0 : convert(shippingBase);
  const freeShipping = itemCount > 0 && shippingBase === 0;
  const amountToFreeShipping = 0;
  const net = roundMoney(subtotal - discount + shipping);
  const rate = STORE_POLICY.tax.vatRatePercent;
  const vatIncluded = VAT_REGISTERED && STORE_POLICY.tax.pricesIncludeVat;
  const vat = !VAT_REGISTERED ? 0 : vatIncluded ? roundMoney((net * rate) / (100 + rate)) : roundMoney((net * rate) / 100);
  const total = vatIncluded || !VAT_REGISTERED ? net : roundMoney(net + vat);

  return {
    lines: priced,
    itemCount,
    subtotal,
    discountPercent,
    discount,
    shipping,
    freeShipping,
    amountToFreeShipping,
    vatRegistered: VAT_REGISTERED,
    vatIncluded,
    vatRatePercent: rate,
    vat,
    total,
  };
}
