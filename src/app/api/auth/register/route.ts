import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";
import { scheduleEmail } from "@/lib/email-jobs";
import { registerSchema } from "@/lib/validators/auth";
import { composePhone, parseIsoDate } from "@/lib/validators/fields";
import { dialCodeFor } from "@/lib/countries";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "register");
  if (limited) return limited;

  try {
    const data = registerSchema.parse(await request.json());
    const email = data.email.toLowerCase();

    const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ code: "EMAIL_TAKEN" }, { status: 409 });
    }

    const passwordHash = await hashPassword(data.password);
    const phone = composePhone(data.phoneCountry, data.phone, dialCodeFor(data.phoneCountry));

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        phone,
        dateOfBirth: parseIsoDate(data.dateOfBirth),
        termsAcceptedAt: new Date(),
        addresses: {
          create: {
            firstName: data.firstName,
            lastName: data.lastName,
            address1: data.street,
            address2: data.address2 || null,
            city: data.city,
            postalCode: data.postcode.toUpperCase(),
            country: data.country.toUpperCase(),
            phone,
            isDefault: true,
          },
        },
      },
      select: { id: true, email: true, name: true, firstName: true, role: true },
    });

    await setSessionCookie(user.id);
    const welcomeTo = user.email;
    if (welcomeTo) scheduleEmail(`welcome ${user.id}`, () => sendWelcomeEmail(welcomeTo, user.name));

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ code: "INVALID_REQUEST", issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
