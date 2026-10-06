import { Prisma, type SihOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SihOrderObject } from "./types";
import { mapSihStatus, extractSender, extractProtection } from "./status";
import { notifyTradeOfferSent } from "./order-status";

export async function logSihEvent(params: {
  orderId: string;
  source: "sih_webhook" | "sih_poll" | "sih_reconcile" | "payment" | "system";
  fromStatus?: SihOrderStatus | null;
  toStatus?: SihOrderStatus | null;
  payload?: unknown;
}): Promise<void> {
  try {
    await prisma.sihOrderEvent.create({
      data: {
        orderId: params.orderId,
        source: params.source,
        fromStatus: params.fromStatus ?? null,
        toStatus: params.toStatus ?? null,
        payload:
          params.payload === undefined
            ? undefined
            : (params.payload as Prisma.InputJsonValue),
      },
    });
  } catch (err) {
    console.error(`[sih] failed to log event for order ${params.orderId}: ${String(err)}`);
  }
}

const PROTECTED_LOCAL: SihOrderStatus[] = ["refunded", "rolled_back", "refund_pending"];

export async function applySihOrderObject(
  orderId: string,
  obj: SihOrderObject,
  source: "sih_webhook" | "sih_poll" | "sih_reconcile" | "system",
): Promise<SihOrderStatus | null> {
  const current = await prisma.sihOrder.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (current && (current.status === "awaiting_payment" || current.status === "paid")) {
    return current.status;
  }
  if (!current) return null;

  const mapped = mapSihStatus(obj.status);
  const sender = extractSender(obj);
  const protection = extractProtection(obj);

  const keepLocal = PROTECTED_LOCAL.includes(current.status);
  const nextStatus = mapped && !keepLocal ? mapped : current.status;

  const data: Prisma.SihOrderUpdateInput = {
    sihStatus: obj.status ?? undefined,
    sihError: obj.error ?? undefined,
    sihOrderId: obj.id != null ? String(obj.id) : undefined,
    ...sender,
    ...protection,
  };
  if (nextStatus !== current.status) {
    data.status = nextStatus;
    if (nextStatus === "finished") data.finishedAt = new Date();
  }
  if (protection.protectionRollbackAmount != null) {
    data.protectionRollbackAmount = new Prisma.Decimal(protection.protectionRollbackAmount);
  }

  await prisma.sihOrder.update({ where: { id: orderId }, data });

  if (nextStatus !== current.status) {
    await logSihEvent({
      orderId,
      source,
      fromStatus: current.status,
      toStatus: nextStatus,
      payload: obj as unknown,
    });
    if (nextStatus === "sent") await notifyTradeOfferSent(orderId).catch(() => {});
  }
  return nextStatus;
}
