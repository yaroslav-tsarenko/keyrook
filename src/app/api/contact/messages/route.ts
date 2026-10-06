import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const PAGE_SIZE = 50;

const updateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "REPLIED"]),
});

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
  const status = searchParams.get("status");
  const where = status === "NEW" || status === "REPLIED" ? { status: status as "NEW" | "REPLIED" } : {};
  const [messages, total, unread] = await Promise.all([
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
  ]);
  return NextResponse.json({ data: messages, total, unread, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  const updated = await prisma.contactMessage.updateMany({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
  if (updated.count === 0) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ success: true });
}
