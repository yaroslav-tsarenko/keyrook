import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, getSessionUser } from "@/lib/auth";
import { verifySteamCallback, fetchSteamProfile, getBaseUrl } from "@/lib/steam";
import { safeNextPath } from "@/lib/safe-next";

export const runtime = "nodejs";

function withFlag(dest: string, key: string, value: string): string {
  return `${dest}${dest.includes("?") ? "&" : "?"}${key}=${value}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = getBaseUrl();
  const next = safeNextPath(url.searchParams.get("next"), "/account");
  const dest = `${base}${next}`;
  const failed = `${base}/auth/login?error=steam&next=${encodeURIComponent(next)}`;

  try {
    const steamId64 = await verifySteamCallback(url.searchParams);
    if (!steamId64) return NextResponse.redirect(failed);

    const profile = await fetchSteamProfile(steamId64);
    const steamData = {
      personaName: profile.personaName,
      profileUrl: profile.profileUrl,
      avatar: profile.avatar,
      avatarFull: profile.avatarFull,
    };
    const existing = await prisma.steamAccount.findUnique({ where: { steamId64 }, select: { userId: true } });

    if (url.searchParams.get("link") === "1") {
      const current = await getSessionUser();
      if (!current) return NextResponse.redirect(failed);
      if (existing && existing.userId !== current.id) return NextResponse.redirect(withFlag(dest, "steam", "taken"));
      const own = await prisma.steamAccount.findUnique({ where: { userId: current.id }, select: { steamId64: true } });
      if (own && own.steamId64 !== steamId64) return NextResponse.redirect(withFlag(dest, "steam", "other"));
      if (existing) await prisma.steamAccount.update({ where: { steamId64 }, data: steamData });
      else await prisma.steamAccount.create({ data: { userId: current.id, steamId64, ...steamData } });
      if (profile.avatar && !current.avatarUrl) await prisma.user.update({ where: { id: current.id }, data: { avatarUrl: profile.avatar } });
      return NextResponse.redirect(withFlag(dest, "steam", "linked"));
    }

    let userId: string;
    if (existing) {
      userId = existing.userId;
      await prisma.steamAccount.update({ where: { steamId64 }, data: steamData });
    } else {
      const user = await prisma.user.create({
        data: {
          name: profile.personaName,
          avatarUrl: profile.avatar,
          steamAccount: { create: { steamId64, ...steamData } },
        },
        select: { id: true },
      });
      userId = user.id;
    }
    await setSessionCookie(userId);
    return NextResponse.redirect(dest);
  } catch (err) {
    console.error("[steam-callback] failed:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(failed);
  }
}
