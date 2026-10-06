import { NextResponse } from "next/server";
import { buildSteamAuthUrl, getBaseUrl } from "@/lib/steam";
import { getSessionUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-next";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = safeNextPath(url.searchParams.get("next"), "/account");
  const callback = new URL(`${getBaseUrl()}/api/auth/steam/callback`);
  callback.searchParams.set("next", next);
  if (url.searchParams.get("link") === "1" && (await getSessionUser())) callback.searchParams.set("link", "1");
  return NextResponse.redirect(buildSteamAuthUrl(callback.toString()));
}
