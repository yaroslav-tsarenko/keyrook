import { prisma } from "@/lib/prisma";
import { sendAlert } from "@/lib/alerts/telegram";
import { logSihEvent } from "./orders";
import { refreshOrderStatus } from "./order-status";

const ROLLBACK_HINTS = ["rollback", "rolled_back", "rolledback", "reverted", "penalized"];

function isRollback(protectionStatus: string | null): boolean {
  if (!protectionStatus) return false;
  const s = protectionStatus.toLowerCase();
  return ROLLBACK_HINTS.some((h) => s.includes(h));
}

export async function finalizeSihOrder(orderId: string): Promise<void> {
  await finalizeItem(orderId);
  const parent = await prisma.sihOrder.findUnique({ where: { id: orderId }, select: { orderId: true } });
  if (parent) await refreshOrderStatus(parent.orderId);
}

async function finalizeItem(orderId: string): Promise<void> {
  const order = await prisma.sihOrder.findUnique({ where: { id: orderId } });
  if (!order) return;

  if (order.status === "failed") {
    const paid = order.paidAt != null;
    if (paid) {
      const claim = await prisma.sihOrder.updateMany({
        where: { id: orderId, status: "failed" },
        data: { status: "refund_pending" },
      });
      if (claim.count > 0) {
        await logSihEvent({
          orderId,
          source: "system",
          fromStatus: "failed",
          toStatus: "refund_pending",
          payload: { reason: "sih_failed_after_payment" },
        });
        await sendAlert(
          `SIH order <b>${orderId}</b> failed at the supplier after payment ` +
            `(${order.sihError ?? "no reason"}). Item: ${order.marketHashName}. ` +
            `Manual refund required.`,
          "critical",
        );
      }
    }
    return;
  }

  const rolledBack = isRollback(order.protectionStatus) || order.protectionRollbackAt != null;
  if (rolledBack && order.status !== "rolled_back" && order.status !== "refunded") {
    const claim = await prisma.sihOrder.updateMany({
      where: { id: orderId, status: { in: ["sent", "finished", "processing", "submitted"] } },
      data: { status: "rolled_back" },
    });
    if (claim.count > 0) {
      await logSihEvent({
        orderId,
        source: "system",
        toStatus: "rolled_back",
        payload: {
          reason: "protection_rollback",
          protectionStatus: order.protectionStatus,
          rollbackAt: order.protectionRollbackAt,
          rollbackAmount: order.protectionRollbackAmount,
        },
      });
      await sendAlert(
        `SIH order <b>${orderId}</b> was rolled back by protection ` +
          `(${order.protectionStatus ?? "rollback"}). Item: ${order.marketHashName}. ` +
          `Buyer refund required.`,
        "critical",
      );
    }
  }
}
