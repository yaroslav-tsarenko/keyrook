import { z } from "zod";
import { addressFields, dateOfBirthField, dialCountryField, emailField, nameField, passwordField, phoneNumberField } from "./fields";

export const registerSchema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "confirmRequired"),
    firstName: nameField("firstNameRequired"),
    lastName: nameField("lastNameRequired"),
    phoneCountry: dialCountryField,
    phone: phoneNumberField,
    dateOfBirth: dateOfBirthField,
    ...addressFields,
    acceptedTerms: z.boolean().refine((v) => v === true, "termsRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "passwordsMismatch", path: ["confirmPassword"] });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "passwordRequired"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "confirmRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "passwordsMismatch", path: ["confirmPassword"] });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const PASSWORD_RESET_TTL_MINUTES = 60;
