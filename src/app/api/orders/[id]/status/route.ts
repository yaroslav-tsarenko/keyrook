import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmail } from "@/lib/email";
import { requireAdmin } from "@/lib/auth";
import { logKeyEvent } from "@/lib/esa/events";
import { loadOrderForEmail, orderEmailPayload } from "@/lib/esa/order-status";

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "DELIVERED", "CANCELLED", "REFUNDED"]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  try {
    const { id } = await params;
    const validated = statusSchema.parse(await request.json());
    const previous = await prisma.order.findUnique({ where: { id }, select: { status: true, paymentStatus: true } });
    if (!previous) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: validated.status,
        paymentStatus: validated.status === "REFUNDED" || (validated.status === "CANCELLED" && previous.paymentStatus === "PAID") ? "REFUNDED" : undefined,
      },
      include: { items: true },
    });

    if (validated.status === "REFUNDED" || validated.status === "CANCELLED") {
      const open = await prisma.keyOrder.findMany({ where: { orderId: id, status: { in: ["refund_pending", "awaiting_payment", "failed"] } }, select: { id: true, status: true } });
      for (const item of open) {
        const next = item.status === "awaiting_payment" || item.status === "failed" ? "failed" : "refunded";
        await prisma.keyOrder.update({ where: { id: item.id }, data: { status: next, ...(next === "refunded" ? { refundedAt: new Date() } : {}) } });
        if (next !== item.status) await logKeyEvent({ keyOrderId: item.id, source: "admin", fromStatus: item.status, toStatus: next, payload: { reason: "admin_order_status", by: admin.email ?? admin.id } });
      }
    }

    if (previous.status !== order.status && (order.status === "DELIVERED" || order.status === "CANCELLED" || order.status === "REFUNDED")) {
      const full = await loadOrderForEmail(order.id);
      if (full) sendOrderStatusEmail(orderEmailPayload(full), order.status).catch(console.error);
    }
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
