import { Prisma, type KeyOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type KeyEventSource = "payment" | "system" | "supplier_webhook" | "supplier_poll" | "admin" | "customer";

export async function logKeyEvent(params: {
  keyOrderId: string;
  source: KeyEventSource;
  fromStatus?: KeyOrderStatus | null;
  toStatus?: KeyOrderStatus | null;
  payload?: unknown;
}): Promise<void> {
  try {
    await prisma.keyOrderEvent.create({
      data: {
        keyOrderId: params.keyOrderId,
        source: params.source,
        fromStatus: params.fromStatus ?? null,
        toStatus: params.toStatus ?? null,
        payload: params.payload === undefined ? undefined : (params.payload as Prisma.InputJsonValue),
      },
    });
  } catch (err) {
    console.error(`[key-order] failed to log event for ${params.keyOrderId}: ${String(err)}`);
  }
}
