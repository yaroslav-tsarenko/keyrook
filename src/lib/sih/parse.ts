import { EXTERIORS, exteriorFromLabel, weaponTypeOf, type ExteriorCode, type WeaponTypeKey } from "@/lib/skins/cs2";

export interface ParsedName {
  weapon: string | null;
  weaponType: WeaponTypeKey | null;
  skinName: string | null;
  exterior: ExteriorCode | null;
  isStatTrak: boolean;
  isSouvenir: boolean;
  isStar: boolean;
}

export function parseMarketHashName(raw: string): ParsedName {
  let name = raw.trim();

  const isSouvenir = /^souvenir\s+/i.test(name);
  if (isSouvenir) name = name.replace(/^souvenir\s+/i, "");

  const isStar = name.startsWith("★");
  if (isStar) name = name.replace(/^★\s*/, "");

  const isStatTrak = /^stattrak™?\s+/i.test(name);
  if (isStatTrak) name = name.replace(/^stattrak™?\s+/i, "");

  let exterior: ExteriorCode | null = null;
  const extMatch = name.match(/\(([^)]+)\)\s*$/);
  if (extMatch) {
    const code = exteriorFromLabel(extMatch[1].trim());
    if (code) {
      exterior = code;
      name = name.replace(/\s*\([^)]+\)\s*$/, "");
    }
  }

  const pipe = name.indexOf("|");
  const weapon = (pipe === -1 ? name : name.slice(0, pipe)).trim() || null;
  const skinName = pipe === -1 ? null : name.slice(pipe + 1).trim() || null;
  const weaponType = weapon ? weaponTypeOf(weapon) : null;
  const starType = weaponType === "knives" || weaponType === "gloves";

  return {
    weapon,
    weaponType: weaponType && starType !== isStar ? null : weaponType,
    skinName,
    exterior,
    isStatTrak,
    isSouvenir,
    isStar,
  };
}

export function floatBand(
  exterior: ExteriorCode | null,
  skinMin: number | null | undefined,
  skinMax: number | null | undefined,
): { floatMin: number; floatMax: number } | null {
  const ext = EXTERIORS.find((e) => e.code === exterior);
  if (!ext) return null;
  const lo = Math.max(ext.floatMin, typeof skinMin === "number" && skinMin >= 0 && skinMin < 1 ? skinMin : 0);
  const hi = Math.min(ext.floatMax, typeof skinMax === "number" && skinMax > 0 && skinMax <= 1 ? skinMax : 1);
  if (hi <= lo) return { floatMin: ext.floatMin, floatMax: ext.floatMax };
  return { floatMin: Math.round(lo * 10000) / 10000, floatMax: Math.round(hi * 10000) / 10000 };
}
