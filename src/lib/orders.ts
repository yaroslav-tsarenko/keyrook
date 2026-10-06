import type { KeySummary } from "@/lib/keys/taxonomy";
import { STORE_POLICY } from "@/config/store-policy";
import { computeTotals, rateConverter, type Totals } from "@/lib/pricing";
import { countryName } from "@/lib/countries";
import { statusMeta } from "@/lib/esa/status";
import { customerMessageFor } from "@/lib/esa/errors";

export interface StoredAddress {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string | null;
  city?: string;
  province?: string | null;
  postalCode?: string;
  country?: string;
}

export type Numeric = number | string | { toString(): string } | null | undefined;

export interface OrderAmountsSource {
  currency?: string | null;
  exchangeRate?: Numeric;
  discountPercent?: Numeric;
  shippingCost?: Numeric;
  items: { price: Numeric; quantity: number }[];
}

export type CustomerOrderState =
  | "awaitingPayment"
  | "paymentFailed"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "refundPending"
  | "cancelled"
  | "refunded";

const STATE_PLATE: Record<CustomerOrderState, string> = {
  awaitingPayment: "PENDING",
  paymentFailed: "FAILED",
  paid: "PAID",
  processing: "PROCESSING",
  shipped: "SHIPPED",
  delivered: "DELIVERED",
  refundPending: "REFUND_PENDING",
  cancelled: "CANCELLED",
  refunded: "REFUNDED",
};

export function toNumber(value: Numeric): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

export function displayOrderNumber(orderNumber: string): string {
  return orderNumber.slice(-8).toUpperCase();
}

export function orderCurrency(order: Pick<OrderAmountsSource, "currency">): string {
  return order.currency || STORE_POLICY.currency;
}

export function orderTotals(order: OrderAmountsSource): Totals {
  const rate = toNumber(order.exchangeRate) || 1;
  return computeTotals(
    order.items.map((item) => ({ price: toNumber(item.price), quantity: item.quantity })),
    {
      convert: rateConverter(rate),
      discountPercent: toNumber(order.discountPercent),
      shippingBase: toNumber(order.shippingCost),
    },
  );
}

const UNFULFILLED_KEY_STATUSES = new Set(["refund_pending", "failed", "refunded"]);

export function customerOrderState(order: { status: string; paymentStatus: string; items?: { keyOrder?: { status: string } | null }[] }): CustomerOrderState {
  if (order.status === "CANCELLED") return "cancelled";
  if (order.status === "REFUNDED" || order.paymentStatus === "REFUNDED") return "refunded";
  if (order.paymentStatus === "FAILED") return "paymentFailed";
  if (order.paymentStatus !== "PAID") return "awaitingPayment";
  if (order.status === "DELIVERED") return "delivered";
  const keyStatuses = (order.items ?? []).map((item) => item.keyOrder?.status).filter((status): status is string => Boolean(status));
  if (keyStatuses.length > 0 && keyStatuses.every((status) => UNFULFILLED_KEY_STATUSES.has(status))) return "refundPending";
  if (order.status === "SHIPPED") return "shipped";
  if (order.status === "PROCESSING") return "processing";
  return "paid";
}

export function invoiceAvailable(order: { paymentStatus: string; paidAt?: Date | string | null }): boolean {
  return order.paymentStatus === "PAID" || (order.paymentStatus === "REFUNDED" && Boolean(order.paidAt));
}

export function plateStatusFor(state: CustomerOrderState): string {
  return STATE_PLATE[state];
}

export function addressLines(address: StoredAddress | null | undefined): string[] {
  if (!address) return [];
  const name = [address.firstName, address.lastName].filter(Boolean).join(" ");
  const cityLine = [address.city, address.postalCode].filter(Boolean).join(" ");
  return [name, address.address1, address.address2 ?? "", cityLine, countryName(address.country)].filter((line): line is string => Boolean(line && line.trim()));
}

export const ORDER_VIEW_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          slug: true,
          images: { take: 1, orderBy: { sortOrder: "asc" as const }, select: { url: true } },
          item: { select: { title: true, productType: true, platform: true, region: true, edition: true, languages: true, genres: true, releaseYear: true, validity: true } },
        },
      },
      keyOrder: {
        select: {
          status: true,
          supplierError: true,
          deliveredAt: true,
          refundedAt: true,
          updatedAt: true,
          quantity: true,
          keys: { select: { id: true, revealedAt: true, keyType: true, createdAt: true }, orderBy: { createdAt: "asc" as const } },
        },
      },
    },
  },
};

export interface ItemDelivery {
  status: string;
  inFlight: boolean;
  tone: string;
  finishedAt: string | null;
  refundedAt: string | null;
  note: string | null;
  keys: { id: string; revealed: boolean; type: string; issuedAt: string | null; revealedAt: string | null }[];
}

export function itemDelivery(
  source:
    | {
        status: string;
        supplierError?: string | null;
        deliveredAt?: Date | null;
        refundedAt?: Date | null;
        keys?: { id: string; revealedAt: Date | null; keyType: string; createdAt?: Date | null }[];
      }
    | null
    | undefined,
): ItemDelivery | null {
  if (!source) return null;
  const meta = statusMeta(source.status);
  const attention = source.status === "refund_pending" || source.status === "failed";
  const note = attention && !source.supplierError?.startsWith("payment_") ? customerMessageFor(source.supplierError) : null;
  return {
    status: source.status,
    inFlight: meta.inFlight,
    tone: meta.color,
    finishedAt: source.deliveredAt ? source.deliveredAt.toISOString() : null,
    refundedAt: source.refundedAt ? source.refundedAt.toISOString() : null,
    note,
    keys: source.status === "delivered"
      ? (source.keys ?? []).map((k) => ({ id: k.id, revealed: Boolean(k.revealedAt), type: k.keyType, issuedAt: k.createdAt ? k.createdAt.toISOString() : null, revealedAt: k.revealedAt ? k.revealedAt.toISOString() : null }))
      : [],
  };
}

interface OrderViewSource extends OrderAmountsSource {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: unknown;
  billingAddress?: unknown;
  shippingMethod?: string | null;
  trackingNumber?: string | null;
  paymentMethod?: string | null;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date | null;
  waiverAcceptedAt?: Date | null;
  waiverText?: string | null;
  items: {
    id: string;
    productName: string;
    variantName: string | null;
    quantity: number;
    price: Numeric;
    product?: { slug: string; images: { url: string }[]; item?: KeySummary | null } | null;
    keyOrder?: Parameters<typeof itemDelivery>[0];
  }[];
}

export function orderView(order: OrderViewSource) {
  const totals = orderTotals(order);
  const delivery = (order.shippingAddress ?? null) as StoredAddress | null;
  const billing = (order.billingAddress ?? null) as StoredAddress | null;
  return {
    id: order.id,
    number: displayOrderNumber(order.orderNumber),
    state: customerOrderState(order),
    status: order.status,
    paymentStatus: order.paymentStatus,
    email: order.customerEmail,
    firstName: delivery?.firstName || order.customerName.split(" ")[0] || "",
    currency: orderCurrency(order),
    totals,
    lines: order.items.map((item, index) => ({
      id: item.id,
      name: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      unit: totals.lines[index]?.unit ?? 0,
      total: totals.lines[index]?.total ?? 0,
      slug: item.product?.slug ?? null,
      imageUrl: item.product?.images[0]?.url ?? null,
      key: item.product?.item ?? null,
      delivery: itemDelivery(item.keyOrder),
    })),
    delivery,
    billing,
    shippingMethod: order.shippingMethod ?? null,
    trackingNumber: order.trackingNumber ?? null,
    paymentMethod: order.paymentMethod ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    invoiceAvailable: invoiceAvailable(order),
    waiverAcceptedAt: order.waiverAcceptedAt ? order.waiverAcceptedAt.toISOString() : null,
    waiverText: order.waiverText ?? null,
    inFlight: order.items.some((item) => itemDelivery(item.keyOrder)?.inFlight),
  };
}

export type OrderView = ReturnType<typeof orderView>;
