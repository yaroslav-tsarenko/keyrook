import type { KeyOrderStatus } from "@prisma/client";

export type ChipColor = "default" | "accent" | "success" | "warning" | "danger";

export interface StatusMeta {
  label: string;
  color: ChipColor;
  inFlight: boolean;
}

export const IN_FLIGHT_STATUSES: KeyOrderStatus[] = ["paid", "submitted", "processing"];

export const KEY_STATUS_META: Record<KeyOrderStatus, StatusMeta> = {
  awaiting_payment: { label: "Awaiting payment", color: "warning", inFlight: true },
  paid: { label: "Payment confirmed", color: "accent", inFlight: true },
  submitted: { label: "Issuing key", color: "accent", inFlight: true },
  processing: { label: "Issuing key", color: "accent", inFlight: true },
  delivered: { label: "Delivered", color: "success", inFlight: false },
  failed: { label: "Failed", color: "danger", inFlight: false },
  refund_pending: { label: "Refund pending", color: "warning", inFlight: false },
  refunded: { label: "Refunded", color: "default", inFlight: false },
};

export function statusMeta(status: string): StatusMeta {
  return KEY_STATUS_META[status as KeyOrderStatus] ?? { label: status, color: "default", inFlight: false };
}

export function mapSupplierStatus(status: string | null | undefined): "processing" | "completed" | "canceled" | "refunded" | null {
  const s = (status ?? "").toLowerCase();
  if (s === "completed" || s === "dispatched" || s === "delivered") return "completed";
  if (s === "canceled" || s === "cancelled" || s === "failed") return "canceled";
  if (s === "refunded") return "refunded";
  if (s === "processing" || s === "new" || s === "pending") return "processing";
  return null;
}
