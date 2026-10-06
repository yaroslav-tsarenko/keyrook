export type WeaponTypeKey = "rifles" | "sniper-rifles" | "pistols" | "smgs" | "shotguns" | "machine-guns" | "knives" | "gloves";

export interface WeaponTypeDef {
  key: WeaponTypeKey;
  label: string;
  singular: string;
  weapons: string[];
}

export const WEAPON_TYPES: WeaponTypeDef[] = [
  { key: "rifles", label: "Rifles", singular: "Rifle", weapons: ["AK-47", "M4A4", "M4A1-S", "AUG", "SG 553", "FAMAS", "Galil AR"] },
  { key: "sniper-rifles", label: "Sniper rifles", singular: "Sniper rifle", weapons: ["AWP", "SSG 08", "SCAR-20", "G3SG1"] },
  {
    key: "pistols",
    label: "Pistols",
    singular: "Pistol",
    weapons: ["Desert Eagle", "USP-S", "Glock-18", "P250", "Five-SeveN", "Tec-9", "CZ75-Auto", "P2000", "Dual Berettas", "R8 Revolver"],
  },
  { key: "smgs", label: "SMGs", singular: "SMG", weapons: ["MAC-10", "MP9", "MP7", "MP5-SD", "UMP-45", "P90", "PP-Bizon"] },
  { key: "shotguns", label: "Shotguns", singular: "Shotgun", weapons: ["XM1014", "MAG-7", "Nova", "Sawed-Off"] },
  { key: "machine-guns", label: "Machine guns", singular: "Machine gun", weapons: ["M249", "Negev"] },
  {
    key: "knives",
    label: "Knives",
    singular: "Knife",
    weapons: [
      "Karambit", "Butterfly Knife", "M9 Bayonet", "Bayonet", "Talon Knife", "Skeleton Knife", "Stiletto Knife", "Ursus Knife",
      "Flip Knife", "Huntsman Knife", "Falchion Knife", "Bowie Knife", "Navaja Knife", "Gut Knife", "Shadow Daggers",
      "Classic Knife", "Paracord Knife", "Survival Knife", "Nomad Knife", "Kukri Knife",
    ],
  },
  {
    key: "gloves",
    label: "Gloves",
    singular: "Gloves",
    weapons: ["Sport Gloves", "Specialist Gloves", "Driver Gloves", "Moto Gloves", "Hand Wraps", "Hydra Gloves", "Bloodhound Gloves", "Broken Fang Gloves"],
  },
];

const WEAPON_INDEX = new Map<string, WeaponTypeKey>(WEAPON_TYPES.flatMap((t) => t.weapons.map((w) => [w, t.key] as const)));

export function weaponTypeOf(weapon: string): WeaponTypeKey | null {
  return WEAPON_INDEX.get(weapon) ?? null;
}

export function weaponTypeDef(key: string | null | undefined): WeaponTypeDef | null {
  return WEAPON_TYPES.find((t) => t.key === key) ?? null;
}

export function weaponSlug(weapon: string): string {
  return weapon
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type RarityKey = "consumer" | "industrial" | "mil-spec" | "restricted" | "classified" | "covert" | "extraordinary" | "contraband";

export interface RarityDef {
  key: RarityKey;
  label: string;
  color: string;
}

export const RARITIES: RarityDef[] = [
  { key: "consumer", label: "Consumer Grade", color: "#b0c3d9" },
  { key: "industrial", label: "Industrial Grade", color: "#5e98d9" },
  { key: "mil-spec", label: "Mil-Spec Grade", color: "#4b69ff" },
  { key: "restricted", label: "Restricted", color: "#8847ff" },
  { key: "classified", label: "Classified", color: "#d32ce6" },
  { key: "covert", label: "Covert", color: "#eb4b4b" },
  { key: "extraordinary", label: "Extraordinary", color: "#8650ac" },
  { key: "contraband", label: "Contraband", color: "#e4ae39" },
];

export function rarityDef(key: string | null | undefined): RarityDef | null {
  return RARITIES.find((r) => r.key === key) ?? null;
}

export type RaritySlug = "consumer" | "industrial" | "milspec" | "restricted" | "classified" | "covert" | "gold";

const RARITY_SLUG: Record<RarityKey, RaritySlug> = {
  consumer: "consumer",
  industrial: "industrial",
  "mil-spec": "milspec",
  restricted: "restricted",
  classified: "classified",
  covert: "covert",
  extraordinary: "gold",
  contraband: "gold",
};

export function raritySlug(key: string | null | undefined): RaritySlug | undefined {
  return key ? RARITY_SLUG[key as RarityKey] : undefined;
}

export function isStarType(weaponType: string | null | undefined): boolean {
  return weaponType === "knives" || weaponType === "gloves";
}

export function rarityRank(key: string | null | undefined): number {
  const index = RARITIES.findIndex((r) => r.key === key);
  return index === -1 ? -1 : index;
}

const COLOR_TO_RARITY: Record<string, RarityKey> = {
  b0c3d9: "consumer",
  "5e98d9": "industrial",
  "4b69ff": "mil-spec",
  "8847ff": "restricted",
  d32ce6: "classified",
  eb4b4b: "covert",
  ffd700: "extraordinary",
  "8650ac": "extraordinary",
  e4ae39: "contraband",
};

export function rarityFromColor(color: string | null | undefined): RarityKey | null {
  if (!color) return null;
  return COLOR_TO_RARITY[color.replace(/^#/, "").toLowerCase()] ?? null;
}

export type ExteriorCode = "FN" | "MW" | "FT" | "WW" | "BS";

export interface ExteriorDef {
  code: ExteriorCode;
  label: string;
  floatMin: number;
  floatMax: number;
}

export const EXTERIORS: ExteriorDef[] = [
  { code: "FN", label: "Factory New", floatMin: 0, floatMax: 0.07 },
  { code: "MW", label: "Minimal Wear", floatMin: 0.07, floatMax: 0.15 },
  { code: "FT", label: "Field-Tested", floatMin: 0.15, floatMax: 0.38 },
  { code: "WW", label: "Well-Worn", floatMin: 0.38, floatMax: 0.45 },
  { code: "BS", label: "Battle-Scarred", floatMin: 0.45, floatMax: 1 },
];

export function exteriorDef(code: string | null | undefined): ExteriorDef | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return EXTERIORS.find((e) => e.code === upper) ?? null;
}

export function exteriorFromLabel(label: string): ExteriorCode | null {
  return EXTERIORS.find((e) => e.label.toLowerCase() === label.toLowerCase())?.code ?? null;
}

export function formatFloat(value: number): string {
  return value.toFixed(value === 0 || value === 1 ? 2 : value < 0.01 ? 4 : 2);
}

export function floatRangeLabel(min: number | null | undefined, max: number | null | undefined): string | null {
  if (min == null || max == null) return null;
  return `${formatFloat(min)}–${formatFloat(max)}`;
}

export interface SkinSummary {
  weaponType: string;
  weapon: string;
  skinName: string | null;
  rarity: string;
  rarityColor: string | null;
  exterior: string | null;
  floatMin: number | null;
  floatMax: number | null;
  isStatTrak: boolean;
  isSouvenir: boolean;
  collection: string | null;
  phase: string | null;
}

export function skinTitle(skin: Pick<SkinSummary, "weapon" | "skinName" | "phase">): string {
  const base = skin.skinName ? `${skin.weapon} | ${skin.skinName}` : skin.weapon;
  return skin.phase ? `${base} (${skin.phase})` : base;
}

export function skinSpecText(skin: Pick<SkinSummary, "exterior" | "floatMin" | "floatMax" | "phase" | "isStatTrak" | "isSouvenir"> | null | undefined, withQuality = false): string | null {
  if (!skin) return null;
  const ext = exteriorDef(skin.exterior);
  const range = floatRangeLabel(skin.floatMin, skin.floatMax);
  const quality = withQuality ? (skin.isStatTrak ? "StatTrak™" : skin.isSouvenir ? "Souvenir" : null) : null;
  const parts = [ext ? ext.label : null, range ? `Float ${range}` : null, skin.phase, quality].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
