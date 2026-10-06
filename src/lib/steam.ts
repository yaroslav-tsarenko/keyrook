import { SITE_URL } from "@/lib/brand";

const STEAM_OPENID = "https://steamcommunity.com/openid/login";
const OPENID_NS = "http://specs.openid.net/auth/2.0";
const IDENTIFIER_SELECT = "http://specs.openid.net/auth/2.0/identifier_select";
const STEAMID64_BASE = BigInt("76561197960265728");

export function getBaseUrl(): string {
  return (process.env.APP_URL?.trim() || SITE_URL).replace(/\/+$/, "");
}

export function buildSteamAuthUrl(returnTo: string): string {
  const params = new URLSearchParams({
    "openid.ns": OPENID_NS,
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": getBaseUrl(),
    "openid.identity": IDENTIFIER_SELECT,
    "openid.claimed_id": IDENTIFIER_SELECT,
  });
  return `${STEAM_OPENID}?${params.toString()}`;
}

export async function verifySteamCallback(query: URLSearchParams): Promise<string | null> {
  const claimedId = query.get("openid.claimed_id");
  const returnTo = query.get("openid.return_to");
  if (!claimedId || !returnTo) return null;
  try {
    if (new URL(returnTo).origin !== new URL(getBaseUrl()).origin) return null;
  } catch {
    return null;
  }

  const body = new URLSearchParams();
  for (const [key, value] of query.entries()) {
    if (key.startsWith("openid.")) body.set(key, value);
  }
  body.set("openid.mode", "check_authentication");

  const res = await fetch(STEAM_OPENID, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  });
  const text = await res.text();
  if (!/is_valid\s*:\s*true/i.test(text)) return null;

  const match = claimedId.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  return match ? match[1] : null;
}

export interface SteamProfile {
  steamId64: string;
  personaName: string | null;
  profileUrl: string | null;
  avatar: string | null;
  avatarFull: string | null;
}

export async function fetchSteamProfile(steamId64: string): Promise<SteamProfile> {
  const key = process.env.STEAM_API_KEY?.trim();
  const fallback: SteamProfile = {
    steamId64,
    personaName: null,
    profileUrl: `https://steamcommunity.com/profiles/${steamId64}`,
    avatar: null,
    avatarFull: null,
  };
  if (!key) return fallback;

  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamId64}`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return fallback;
    const json = (await res.json()) as { response?: { players?: Array<Record<string, string>> } };
    const p = json.response?.players?.[0];
    if (!p) return fallback;
    return {
      steamId64,
      personaName: p.personaname ?? null,
      profileUrl: p.profileurl ?? fallback.profileUrl,
      avatar: p.avatarmedium ?? p.avatar ?? null,
      avatarFull: p.avatarfull ?? null,
    };
  } catch {
    return fallback;
  }
}

export interface ParsedTradeUrl {
  partnerId: string;
  token: string;
}

export function parseTradeUrl(raw: string): ParsedTradeUrl | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" || url.hostname !== "steamcommunity.com") return null;
    if (!/^\/tradeoffer\/new\/?$/.test(url.pathname)) return null;
    const partnerId = url.searchParams.get("partner");
    const token = url.searchParams.get("token");
    if (!partnerId || !/^\d{1,10}$/.test(partnerId)) return null;
    if (!token || !/^[A-Za-z0-9_-]{6,16}$/.test(token)) return null;
    return { partnerId, token };
  } catch {
    return null;
  }
}

export function partnerIdFor(steamId64: string): string {
  return (BigInt(steamId64) - STEAMID64_BASE).toString();
}

export function canonicalTradeUrl(parsed: ParsedTradeUrl): string {
  return `https://steamcommunity.com/tradeoffer/new/?partner=${parsed.partnerId}&token=${parsed.token}`;
}
