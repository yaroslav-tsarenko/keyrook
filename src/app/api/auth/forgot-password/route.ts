import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createResetToken } from "@/lib/token";
import { sendPasswordResetEmail } from "@/lib/email";
import { scheduleEmail } from "@/lib/email-jobs";
import { SITE_URL } from "@/lib/brand";
import { forgotPasswordSchema, PASSWORD_RESET_TTL_MINUTES } from "@/lib/validators/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "forgotPassword");
  if (limited) return limited;

  try {
    const parsed = forgotPasswordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ code: "INVALID_EMAIL" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email: { equals: parsed.data.email, mode: "insensitive" } } });
    if (!user) {
      return NextResponse.json({ success: true });
    }

    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const { token, tokenHash } = createResetToken();
    await prisma.passwordResetToken.create({
      data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000) },
    });

    const resetUrl = `${SITE_URL}/auth/reset-password?token=${token}`;
    const email = user.email;
    if (email) scheduleEmail(`password reset ${user.id}`, () => sendPasswordResetEmail(email, resetUrl, user.firstName || user.name));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
