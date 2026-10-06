import { DEFAULT_COUNTRY_CODE, DELIVERY_COUNTRIES } from "@/lib/countries";

export function splitPhone(phone: string | null | undefined): { phoneCountry: string; phoneNational: string } {
  if (!phone) return { phoneCountry: DEFAULT_COUNTRY_CODE, phoneNational: "" };
  const match = /^(\+\d{1,4})\s*(.*)$/.exec(phone.trim());
  if (!match) return { phoneCountry: DEFAULT_COUNTRY_CODE, phoneNational: phone.trim() };
  const country = DELIVERY_COUNTRIES.find((c) => c.phone === match[1]);
  return country ? { phoneCountry: country.code, phoneNational: match[2] } : { phoneCountry: DEFAULT_COUNTRY_CODE, phoneNational: phone.trim() };
}

export function isoDate(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export const ADDRESS_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  address1: true,
  address2: true,
  city: true,
  postalCode: true,
  country: true,
  phone: true,
  isDefault: true,
} as const;
