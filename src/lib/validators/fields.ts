import { z } from "zod";
import { STORE_POLICY } from "@/config/store-policy";
import { isDeliveryCountry } from "@/lib/countries";

export const VALIDATION_VALUES = {
  minAge: STORE_POLICY.minAge,
  minPassword: 8,
} as const;

export const nameField = (key: string) => z.string().trim().min(1, key).max(80, "tooLong");

export const emailField = z.string().trim().min(1, "emailRequired").email("emailInvalid").max(200, "tooLong");

export const passwordField = z
  .string()
  .min(VALIDATION_VALUES.minPassword, "passwordRule")
  .max(128, "tooLong")
  .regex(/\d/, "passwordRule");

export const phoneNumberField = z
  .string()
  .trim()
  .min(1, "phoneRequired")
  .regex(/^[0-9][0-9 ()-]{5,19}$/, "phoneInvalid");

export const dialCountryField = z.string().trim().min(2, "phoneRequired");

export const countryField = z
  .string()
  .trim()
  .min(1, "countryRequired")
  .refine((code) => isDeliveryCountry(code), "countryNotServed");

export const postcodeField = z.string().trim().min(2, "postcodeRequired").max(12, "postcodeInvalid");

export const addressFields = {
  street: z.string().trim().min(3, "streetRequired").max(120, "tooLong"),
  address2: z.string().trim().max(120, "tooLong").optional(),
  city: z.string().trim().min(1, "cityRequired").max(80, "tooLong"),
  country: countryField,
  postcode: postcodeField,
};

export function ageOn(dob: Date, today: Date = new Date()): number {
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date;
}

export const dateOfBirthField = z
  .string()
  .min(1, "dobRequired")
  .refine((value) => parseIsoDate(value) !== null, "dobInvalid")
  .refine((value) => {
    const date = parseIsoDate(value);
    return !date || ageOn(date) <= 120;
  }, "dobInvalid")
  .refine((value) => {
    const date = parseIsoDate(value);
    return !date || ageOn(date) >= STORE_POLICY.minAge;
  }, "dobTooYoung");

export function composePhone(dialCountry: string, number: string, dialCode: string): string {
  const national = number.replace(/[^\d]/g, "").replace(/^0+/, "");
  return `${dialCode} ${national}`.trim();
}
