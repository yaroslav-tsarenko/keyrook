import type { SihOrderStatus } from "@prisma/client";
import type { SihOrderObject } from "./types";

export function mapSihStatus(sihStatus: string | null | undefined): SihOrderStatus | null {
  switch ((sihStatus ?? "").toLowerCase()) {
    case "created":
      return "submitted";
    case "processing":
      return "processing";
    case "sent":
      return "sent";
    case "finished":
      return "finished";
    case "failed":
    case "penalized":
      return "failed";
    default:
      return null;
  }
}

export const TERMINAL_STATUSES: SihOrderStatus[] = [
  "finished",
  "failed",
  "refunded",
  "rolled_back",
];

export const IN_FLIGHT_STATUSES: SihOrderStatus[] = [
  "submitted",
  "processing",
  "sent",
];

export function isTerminal(status: SihOrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function extractSender(order: SihOrderObject) {
  const s = order.sender;
  if (!s) return {};
  return {
    senderOfferId: s.offerId != null ? String(s.offerId) : null,
    senderNickname: s.nickname ?? null,
    senderAvatar: s.avatar ?? null,
    senderTimeout: parseTimestamp(s.timeout),
  };
}

export function extractProtection(order: SihOrderObject) {
  const p = order.protection;
  if (!p) return {};
  return {
    protectionStatus: p.status ?? null,
    protectionError: p.error ?? null,
    protectionRollbackAt: parseTimestamp(p.rollbackAt),
    protectionRollbackAmount: p.rollbackAmount != null ? p.rollbackAmount : null,
  };
}

export function parseTimestamp(v: string | number | null | undefined): Date | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const asNum = Number(v);
  if (!Number.isNaN(asNum) && /^\d+$/.test(v.trim())) {
    return parseTimestamp(asNum);
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
