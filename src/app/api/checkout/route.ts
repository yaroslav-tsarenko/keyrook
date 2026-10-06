import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSessionUser } from "@/lib/auth";
import { hasEnv } from "@/lib/env";
import { getBaseUrl } from "@/lib/steam";
import { clientIp, consumeRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { createSkinCheckout, SkinCheckoutError } from "@/lib/sih/checkout";
import { getPaymentProvider, PaymentUnavailableError } from "@/lib/payments/provider";
import { checkoutRequestSchema } from "@/lib/validators/checkout";
import { composePhone } from "@/lib/validators/fields";
import { dialCodeFor } from "@/lib/countries";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });

    const limited = rateLimitResponse(consumeRateLimit("checkout", user.id));
    if (limited) return limited;

    const provider = getPaymentProvider();
    if (!provider.available) {
      return NextResponse.json({ code: "PAYMENTS_NOT_CONNECTED" }, { status: 503 });
    }
    if (!hasEnv("SIH_API_KEY")) {
      return NextResponse.json({ code: "PAYMENT_UNAVAILABLE" }, { status: 503 });
    }

    const body = checkoutRequestSchema.parse(await request.json());
    const { form } = body;
    const phone = form.contact.phone ? composePhone(form.contact.phoneCountry, form.contact.phone, dialCodeFor(form.contact.phoneCountry)) : null;
    const ip = clientIp(request);

    const result = await createSkinCheckout({
      userId: user.id,
      items: body.items,
      currency: body.currency,
      expectedTotal: body.expectedTotal,
      contact: { email: form.contact.email.toLowerCase(), firstName: form.contact.firstName, lastName: form.contact.lastName, phone },
      billing: {
        firstName: form.contact.firstName,
        lastName: form.contact.lastName,
        address1: form.billing.street,
        address2: form.billing.address2 || null,
        city: form.billing.city,
        postalCode: form.billing.postcode,
        country: form.billing.country,
      },
      ip: ip === "unknown" ? "127.0.0.1" : ip,
      baseUrl: getBaseUrl(),
    });
    return NextResponse.json({ orderId: result.orderId, paymentLink: result.paymentUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof PaymentUnavailableError) {
      return NextResponse.json({ code: error.code }, { status: 503 });
    }
    if (error instanceof SkinCheckoutError) {
      return NextResponse.json({ code: error.code, ...error.details }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ code: "INVALID_REQUEST", issues: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) }, { status: 400 });
    }
    console.error("Checkout failed:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
