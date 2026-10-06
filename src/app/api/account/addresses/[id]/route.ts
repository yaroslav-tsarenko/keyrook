import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validators/profile";
import { composePhone } from "@/lib/validators/fields";
import { dialCodeFor } from "@/lib/countries";
import { ADDRESS_SELECT } from "@/lib/account";

async function ownAddress(id: string) {
  const user = await getSessionUser();
  if (!user) return { user: null, address: null };
  const address = await prisma.address.findFirst({ where: { id, userId: user.id } });
  return { user, address };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, address } = await ownAddress(id);
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  if (!address) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  const body = await request.json().catch(() => ({}));

  if (body && body.setDefault === true && Object.keys(body).length === 1) {
    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return NextResponse.json({ success: true });
  }

  const parsed = addressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ code: "INVALID_REQUEST", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
  }
  const data = parsed.data;
  const updated = await prisma.$transaction(async (tx) => {
    if (data.isDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    return tx.address.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        address1: data.street,
        address2: data.address2 || null,
        city: data.city,
        postalCode: data.postcode.toUpperCase(),
        country: data.country.toUpperCase(),
        phone: data.phone ? composePhone(data.phoneCountry ?? "GB", data.phone, dialCodeFor(data.phoneCountry ?? "GB")) : null,
        isDefault: data.isDefault ? true : address.isDefault,
      },
      select: ADDRESS_SELECT,
    });
  });
  return NextResponse.json({ address: updated });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, address } = await ownAddress(id);
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  if (!address) return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  await prisma.address.delete({ where: { id } });
  if (address.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return NextResponse.json({ success: true });
}
