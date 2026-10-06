import { z } from "zod";
import { STORE_POLICY } from "@/config/store-policy";
import { addressFields, dialCountryField, emailField, nameField } from "./fields";

export const checkoutAddressSchema = z.object({
  firstName: nameField("firstNameRequired"),
  lastName: nameField("lastNameRequired"),
  ...addressFields,
});

export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;

const optionalPhone = z
  .string()
  .trim()
  .max(24, "tooLong")
  .refine((v) => v === "" || /^[0-9][0-9 ()-]{5,19}$/.test(v), "phoneInvalid");

export const checkoutFormSchema = z.object({
  contact: z.object({
    email: emailField,
    firstName: nameField("firstNameRequired"),
    lastName: nameField("lastNameRequired"),
    phoneCountry: dialCountryField,
    phone: optionalPhone,
  }),
  billing: z.object({
    street: addressFields.street,
    address2: addressFields.address2,
    city: addressFields.city,
    country: addressFields.country,
    postcode: addressFields.postcode,
  }),
  acceptedPolicies: z.boolean().refine((v) => v === true, "policiesRequired"),
  acceptedWaiver: z.boolean().refine((v) => v === true, "waiverRequired"),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export const checkoutItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(64),
      quantity: z.number().int().min(1).max(STORE_POLICY.limits.maxQtyPerItem).optional(),
    }),
  )
  .min(1, "cartEmpty")
  .max(STORE_POLICY.limits.maxItemsPerOrder);

export const checkoutQuoteSchema = z.object({
  items: checkoutItemsSchema,
  currency: z.string().optional(),
});

export const checkoutRequestSchema = checkoutQuoteSchema.extend({
  form: checkoutFormSchema,
  expectedTotal: z.number().nonnegative(),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
