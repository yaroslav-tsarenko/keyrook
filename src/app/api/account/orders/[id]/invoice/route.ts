import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { invoiceAvailable } from "@/lib/orders";
import { invoiceFilename, renderInvoicePdf } from "@/lib/invoice";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  const order = await prisma.order.findFirst({ where: { id, userId: user.id }, include: { items: true } });
  if (!order || !invoiceAvailable(order)) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  const pdf = await renderInvoicePdf(order);
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceFilename(order.orderNumber)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
