import { z } from "zod";
import { addressFields, dateOfBirthField, dialCountryField, emailField, nameField, passwordField, phoneNumberField } from "./fields";

export const profileSchema = z.object({
  email: z.union([emailField, z.literal("")]).optional(),
  firstName: nameField("firstNameRequired"),
  lastName: nameField("lastNameRequired"),
  phoneCountry: dialCountryField,
  phone: phoneNumberField,
  dateOfBirth: dateOfBirthField,
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "passwordRequired"),
    password: passwordField,
    confirmPassword: z.string().min(1, "confirmRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "passwordsMismatch", path: ["confirmPassword"] });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

export const addressSchema = z.object({
  firstName: nameField("firstNameRequired"),
  lastName: nameField("lastNameRequired"),
  ...addressFields,
  phoneCountry: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[0-9][0-9 ()-]{5,19}$/.test(v), "phoneInvalid"),
  isDefault: z.boolean().optional(),
});

export type AddressFormData = z.infer<typeof addressSchema>;
