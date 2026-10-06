import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const parsed = loginSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 400 });
    }
    const { email, password } = parsed.data;

    const limited = rateLimit(request, "login", email.toLowerCase());
    if (limited) return limited;

    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
    const valid = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid) {
      return NextResponse.json({ code: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    await setSessionCookie(user.id);

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
