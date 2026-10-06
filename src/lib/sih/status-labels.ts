
export type ChipColor = "default" | "accent" | "success" | "warning" | "danger";

export interface StatusMeta {
  label: string;
  color: ChipColor;
  inFlight: boolean;
}

export const SIH_STATUS_META: Record<string, StatusMeta> = {
  awaiting_payment: { label: "Awaiting payment", color: "warning", inFlight: true },
  paid: { label: "Payment confirmed", color: "accent", inFlight: true },
  submitted: { label: "Processing", color: "accent", inFlight: true },
  processing: { label: "Processing", color: "accent", inFlight: true },
  sent: { label: "Trade offer sent", color: "accent", inFlight: true },
  finished: { label: "Delivered", color: "success", inFlight: false },
  failed: { label: "Failed", color: "danger", inFlight: false },
  refund_pending: { label: "Refund pending", color: "warning", inFlight: false },
  refunded: { label: "Refunded", color: "default", inFlight: false },
  rolled_back: { label: "Rolled back — refund pending", color: "danger", inFlight: false },
};

export function statusMeta(status: string): StatusMeta {
  return SIH_STATUS_META[status] ?? { label: status, color: "default", inFlight: false };
}
