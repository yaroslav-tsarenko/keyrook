import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { buildSkinQuote, publicSkinQuote, SkinCheckoutError } from "@/lib/sih/checkout";
import { checkoutQuoteSchema } from "@/lib/validators/checkout";

export async function POST(request: NextRequest) {
  try {
    const body = checkoutQuoteSchema.parse(await request.json());
    const quote = await buildSkinQuote(body);
    return NextResponse.json(publicSkinQuote(quote));
  } catch (error) {
    if (error instanceof SkinCheckoutError) {
      return NextResponse.json({ code: error.code, ...error.details }, { status: error.status });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
    }
    console.error("Checkout quote failed:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }
}
