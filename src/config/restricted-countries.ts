export const RESTRICTED_COUNTRIES = [
  { code: "RU", name: "Russia" },
  { code: "BY", name: "Belarus" },
  { code: "IR", name: "Iran" },
  { code: "KP", name: "North Korea" },
  { code: "SY", name: "Syria" },
  { code: "CU", name: "Cuba" },
] as const;

export const RESTRICTED_TERRITORIES = [
  "Crimea",
  "the Donetsk region",
  "the Luhansk region",
  "the occupied parts of the Zaporizhzhia region",
  "the occupied parts of the Kherson region",
] as const;

export const RESTRICTED_TERRITORIES_STATEMENT =
  "We do not deliver to or accept orders from the temporarily occupied territories of Ukraine (Crimea, the Donetsk and Luhansk regions, and the occupied parts of the Zaporizhzhia and Kherson regions).";

export const RESTRICTED_COUNTRY_CODES: ReadonlySet<string> = new Set(RESTRICTED_COUNTRIES.map((c) => c.code));

export function isRestrictedCountry(code: string | null | undefined): boolean {
  return Boolean(code) && RESTRICTED_COUNTRY_CODES.has(String(code).toUpperCase());
}

export function restrictedCountriesSentence(): string {
  const names = RESTRICTED_COUNTRIES.map((c) => c.name);
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
