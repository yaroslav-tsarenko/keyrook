export const STEAM_IMAGE_CDN = "https://community.cloudflare.steamstatic.com/economy/image";

export const STEAM_IMAGE_HOSTS = [
  "community.cloudflare.steamstatic.com",
  "community.akamai.steamstatic.com",
  "community.fastly.steamstatic.com",
  "steamcommunity-a.akamaihd.net",
];

export function sihImageUrl(hash: string | null | undefined, size = "360fx360f"): string | null {
  if (!hash) return null;
  if (/^https?:\/\//i.test(hash)) {
    try {
      return STEAM_IMAGE_HOSTS.includes(new URL(hash).hostname) ? hash : null;
    } catch {
      return null;
    }
  }
  if (!/^[A-Za-z0-9_-]+$/.test(hash)) return null;
  return `${STEAM_IMAGE_CDN}/${hash}/${size}`;
}
