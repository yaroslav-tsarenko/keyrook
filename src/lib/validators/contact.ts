import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120, "Use 120 characters or fewer"),
  email: z.string().trim().email("Enter an email address like name@example.com"),
  orderNumber: z.string().trim().max(40, "Use 40 characters or fewer").optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Choose a subject").max(120),
  message: z.string().trim().min(10, "Write at least 10 characters").max(5000, "Use 5,000 characters or fewer"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
