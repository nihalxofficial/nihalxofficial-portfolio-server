import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(180),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(5000),
  location: z.string().trim().max(120).optional(),
});

export const contactQuerySchema = z.object({
  status: z.enum(["unread", "read", "replied", "archived", "all"]).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const updateContactSchema = z.object({
  status: z.enum(["unread", "read", "replied", "archived"]),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
