import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { hashResetToken } from "@/lib/token";
import { resetPasswordSchema } from "@/lib/validators/auth";

async function findValidToken(token: string | null | undefined) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;
  return record;
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  const record = await findValidToken(token);
  return NextResponse.json({ valid: Boolean(record) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const record = await findValidToken(body?.token);
    if (!record) {
      return NextResponse.json({ code: "INVALID_TOKEN" }, { status: 400 });
    }
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ code: "INVALID_REQUEST", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const now = new Date();
    const claimed = await prisma.$transaction(async (tx) => {
      const claim = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claim.count !== 1) return false;
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await tx.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: now } });
      return true;
    });
    if (!claimed) {
      return NextResponse.json({ code: "INVALID_TOKEN" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
