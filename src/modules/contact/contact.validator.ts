import { z } from "zod";

/** A cleared date input must remove the range bound instead of failing coercion. */
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

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
  sort: z
    .enum(["newest", "oldest", "name", "email", "subject", "status", "updated"])
    .optional(),
  delivery: z.enum(["delivered", "failed", "all"]).optional(),
  from: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  to: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const updateContactSchema = z.object({
  status: z.enum(["unread", "read", "replied", "archived"]),
});

/** Reply drafted in the dashboard inbox and sent through the configured SMTP. */
export const replyContactSchema = z.object({
  to: z.string().trim().email("Recipient must be a valid email address").max(180),
  subject: z.string().trim().min(1, "A subject is required").max(200),
  body: z.string().trim().min(1, "Write something before sending").max(10000),
  /** Keep a copy in the owner's inbox. Defaults to true. */
  ccOwner: z.boolean().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type ContactListQuery = z.infer<typeof contactQuerySchema>;
export type ContactReplyInput = z.infer<typeof replyContactSchema>;
