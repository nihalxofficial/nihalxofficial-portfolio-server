import { z } from "zod";

export const uploadMetaSchema = z.object({
  folder: z.string().trim().max(60).optional(),
  name: z.string().trim().max(120).optional(),
});

export const uploadBase64Schema = z.object({
  // Either a raw base64 string or a data:image/...;base64 uri.
  image: z.string().min(32, "Image data is too short").max(14_000_000),
  mimeType: z
    .enum(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"])
    .optional(),
  name: z.string().trim().max(120).optional(),
  folder: z.string().trim().max(60).optional(),
});

export const uploadFromUrlSchema = uploadMetaSchema.extend({
  url: z.string().trim().url("Provide a full image url").max(1000),
});

export const listMediaQuerySchema = z.object({
  folder: z.string().trim().max(60).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

export type UploadFromUrlInput = z.infer<typeof uploadFromUrlSchema>;
