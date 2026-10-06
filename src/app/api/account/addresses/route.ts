import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validators/profile";
import { composePhone } from "@/lib/validators/fields";
import { dialCodeFor } from "@/lib/countries";
import { ADDRESS_SELECT } from "@/lib/account";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    select: ADDRESS_SELECT,
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  const parsed = addressSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_REQUEST", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  }
  const data = parsed.data;
  const count = await prisma.address.count({ where: { userId: user.id } });
  if (count >= 10) return NextResponse.json({ code: "ADDRESS_LIMIT" }, { status: 409 });
  const makeDefault = data.isDefault || count === 0;
  const address = await prisma.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    return tx.address.create({
      data: {
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        address1: data.street,
        address2: data.address2 || null,
        city: data.city,
        postalCode: data.postcode.toUpperCase(),
        country: data.country.toUpperCase(),
        phone: data.phone ? composePhone(data.phoneCountry ?? "GB", data.phone, dialCodeFor(data.phoneCountry ?? "GB")) : null,
        isDefault: makeDefault,
      },
      select: ADDRESS_SELECT,
    });
  });
  return NextResponse.json({ address }, { status: 201 });
}
