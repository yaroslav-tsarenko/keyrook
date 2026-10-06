import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const subscribeSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "newsletter");
  if (limited) return limited;

  let email: string;
  try {
    email = subscribeSchema.parse(await request.json()).email;
  } catch {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  try {
    await prisma.newsletter.upsert({
      where: { email },
      update: { unsubscribedAt: null },
      create: { email },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter subscribe failed:", error);
    return NextResponse.json({ error: "Could not subscribe" }, { status: 500 });
  }
}
