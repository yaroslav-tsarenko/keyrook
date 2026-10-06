import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { passwordChangeSchema } from "@/lib/validators/profile";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_REQUEST", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  }
  const valid = user.passwordHash ? await verifyPassword(parsed.data.currentPassword, user.passwordHash) : false;
  if (!valid) return NextResponse.json({ code: "WRONG_PASSWORD" }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  return NextResponse.json({ success: true });
}
