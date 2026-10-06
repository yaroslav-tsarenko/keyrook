import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactSchema } from "@/lib/validators/contact";
import { sendContactFormEmail, sendContactAutoReplyEmail } from "@/lib/email";
import { scheduleEmail } from "@/lib/email-jobs";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "contact");
  if (limited) return limited;

  const parsed = contactSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { code: "INVALID_REQUEST", issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }

  const message = parsed.data;
  const ip = clientIp(request);
  try {
    await prisma.contactMessage.create({
      data: {
        name: message.name,
        email: message.email.toLowerCase(),
        subject: message.subject,
        orderNumber: message.orderNumber || null,
        message: message.message,
        ip: ip === "unknown" ? null : ip,
      },
    });
  } catch (error) {
    console.error("Contact message could not be stored:", error);
    return NextResponse.json({ code: "SERVER_ERROR" }, { status: 500 });
  }

  scheduleEmail("contact form", () => sendContactFormEmail(message));
  scheduleEmail("contact auto-reply", () => sendContactAutoReplyEmail(message));

  return NextResponse.json({ success: true });
}
