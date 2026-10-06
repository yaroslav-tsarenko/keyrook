import { prisma } from "@/lib/prisma";
import { scheduleEmail } from "@/lib/email-jobs";
import { sendOrderConfirmationEmail, sendOrderInvoiceEmail } from "@/lib/email";
import { sendAlert } from "@/lib/alerts/telegram";
import { displayOrderNumber, toNumber } from "@/lib/orders";
import type { PaymentEvent, PaymentProviderId } from "@/lib/payments/provider";
import { logSihEvent } from "@/lib/sih/orders";
import { submitOrderToSih } from "@/lib/sih/checkout";
import { loadOrderForEmail, orderEmailPayload, refreshOrderStatus } from "@/lib/sih/order-status";

export type SettlementOutcome = "paid" | "already_paid" | "failed" | "review" | "ignored" | "recorded";

async function logAll(orderId: string, payload: Record<string, unknown>) {
  const items = await prisma.sihOrder.findMany({ where: { orderId }, select: { id: true } });
  for (const item of items) await logSihEvent({ orderId: item.id, source: "payment", payload });
}

async function holdForReview(order: { id: string; orderNumber: string; notes: string | null }, note: string) {
  if (!order.notes?.includes(note)) {
    await prisma.order.update({ where: { id: order.id }, data: { notes: [order.notes, note].filter(Boolean).join("\n") } });
  }
  await sendAlert(`Order <b>${displayOrderNumber(order.orderNumber)}</b>: ${note}`, "critical");
}

async function findOrder(event: PaymentEvent) {
  const include = { sihOrders: { select: { id: true, status: true } } } as const;
  if (event.orderId) return prisma.order.findUnique({ where: { id: event.orderId }, include });
  return prisma.order.findFirst({ where: { paymentId: event.providerRef }, include });
}

export async function settlePayment(provider: PaymentProviderId, event: PaymentEvent): Promise<SettlementOutcome> {
  const order = await findOrder(event);
  if (!order) return "ignored";

  await logAll(order.id, { provider, providerRef: event.providerRef, status: event.status, amount: event.amount, currency: event.currency });

  if (order.paymentId && order.paymentId !== event.providerRef) {
    if (event.status !== "paid") return "ignored";
    await sendAlert(`Payment ${event.providerRef} (${provider}) completed for order <b>${order.id}</b> but the order expects payment ${order.paymentId}. Held for review.`, "critical");
    return "review";
  }

  switch (event.status) {
    case "paid": {
      const expected = toNumber(order.chargeTotal ?? order.total);
      const amountOk = event.amount !== null && Number.isFinite(event.amount) && Math.round(event.amount * 100) === Math.round(expected * 100);
      const currencyOk = event.currency !== null && event.currency.toUpperCase() === order.currency.toUpperCase();
      if (!amountOk || !currencyOk) {
        await holdForReview(order, `Payment ${event.providerRef} reported ${event.amount ?? "?"} ${event.currency ?? "?"}; expected ${expected.toFixed(2)} ${order.currency}. Held for review.`);
        return "review";
      }

      const paidAt = new Date();
      const claimed = await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: { not: "PAID" }, status: { not: "REFUNDED" } },
        data: { paymentStatus: "PAID", status: "CONFIRMED", paidAt, paymentId: event.providerRef },
      });
      if (claimed.count > 0) {
        const items = await prisma.sihOrder.findMany({
          where: { orderId: order.id, OR: [{ status: "awaiting_payment" }, { status: "failed", sihError: { startsWith: "payment_" } }] },
          select: { id: true, status: true },
        });
        for (const item of items) {
          const flip = await prisma.sihOrder.updateMany({ where: { id: item.id, status: item.status }, data: { status: "paid", paidAt, sihError: null } });
          if (flip.count > 0) await logSihEvent({ orderId: item.id, source: "payment", fromStatus: item.status, toStatus: "paid" });
        }
        const full = await loadOrderForEmail(order.id);
        if (full) {
          const payload = orderEmailPayload(full);
          scheduleEmail(`order confirmation ${full.orderNumber}`, () => sendOrderConfirmationEmail(payload));
          scheduleEmail(`order invoice ${full.orderNumber}`, () => sendOrderInvoiceEmail(payload));
        }
      }
      const toSubmit = await prisma.sihOrder.findMany({ where: { orderId: order.id, status: "paid" }, select: { id: true } });
      for (const item of toSubmit) await submitOrderToSih(item.id);
      await refreshOrderStatus(order.id);
      return claimed.count > 0 ? "paid" : "already_paid";
    }
    case "failed": {
      const flipped = await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: "PENDING" },
        data: { paymentStatus: "FAILED", status: "CANCELLED" },
      });
      if (flipped.count > 0) {
        for (const item of order.sihOrders.filter((s) => s.status === "awaiting_payment")) {
          const flip = await prisma.sihOrder.updateMany({ where: { id: item.id, status: "awaiting_payment" }, data: { status: "failed", sihError: "payment_failed" } });
          if (flip.count > 0) await logSihEvent({ orderId: item.id, source: "payment", fromStatus: "awaiting_payment", toStatus: "failed" });
        }
      }
      return "failed";
    }
    default:
      return "recorded";
  }
}
