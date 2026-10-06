import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validators/profile";
import { composePhone, parseIsoDate } from "@/lib/validators/fields";
import { dialCodeFor } from "@/lib/countries";
import { ADDRESS_SELECT, isoDate, splitPhone } from "@/lib/account";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    select: ADDRESS_SELECT,
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({
    profile: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      ...splitPhone(user.phone),
      dateOfBirth: isoDate(user.dateOfBirth),
    },
    addresses,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_REQUEST", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  }
  const data = parsed.data;
  const newEmail = !user.email && data.email ? data.email.toLowerCase() : null;
  if (newEmail) {
    const taken = await prisma.user.findFirst({ where: { email: { equals: newEmail, mode: "insensitive" } }, select: { id: true } });
    if (taken) return NextResponse.json({ code: "EMAIL_TAKEN", issues: [{ path: "email", message: "emailTaken" }] }, { status: 409 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`,
      phone: composePhone(data.phoneCountry, data.phone, dialCodeFor(data.phoneCountry)),
      dateOfBirth: parseIsoDate(data.dateOfBirth),
      ...(newEmail ? { email: newEmail } : {}),
    },
  });
  return NextResponse.json({ success: true });
}
