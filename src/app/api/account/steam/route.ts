import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { canonicalTradeUrl, parseTradeUrl, partnerIdFor } from "@/lib/steam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ tradeUrl: z.string().trim().min(1).max(300) });

async function steamView(userId: string) {
  const steam = await prisma.steamAccount.findUnique({
    where: { userId },
    select: { steamId64: true, personaName: true, avatar: true, profileUrl: true, tradeUrl: true, tradeUrlVerified: true, tradeUrlUpdatedAt: true },
  });
  return steam
    ? {
        steamId64: steam.steamId64,
        personaName: steam.personaName,
        avatar: steam.avatar,
        profileUrl: steam.profileUrl,
        tradeUrl: steam.tradeUrl,
        tradeUrlVerified: steam.tradeUrlVerified,
        tradeUrlUpdatedAt: steam.tradeUrlUpdatedAt ? steam.tradeUrlUpdatedAt.toISOString() : null,
      }
    : null;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });
  return NextResponse.json({ steam: await steamView(user.id) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ code: "UNAUTHORISED" }, { status: 401 });

  const steam = await prisma.steamAccount.findUnique({ where: { userId: user.id } });
  if (!steam) return NextResponse.json({ code: "STEAM_NOT_LINKED" }, { status: 409 });

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  const parsed = body.success ? parseTradeUrl(body.data.tradeUrl) : null;
  if (!parsed) return NextResponse.json({ code: "TRADE_URL_INVALID" }, { status: 400 });
  if (parsed.partnerId !== partnerIdFor(steam.steamId64)) {
    return NextResponse.json({ code: "TRADE_URL_OTHER_ACCOUNT" }, { status: 400 });
  }

  await prisma.steamAccount.update({
    where: { userId: user.id },
    data: {
      tradeUrl: canonicalTradeUrl(parsed),
      tradePartnerId: parsed.partnerId,
      tradeToken: parsed.token,
      tradeUrlVerified: true,
      tradeUrlUpdatedAt: new Date(),
    },
  });
  return NextResponse.json({ steam: await steamView(user.id) });
}
