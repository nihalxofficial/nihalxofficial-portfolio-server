import { z } from "zod";

export const sectionSchema = z.object({
  key: z.string().min(1, "Key is required"),
  label: z.string().optional(),
  enabled: z.boolean().optional(),
  order: z.number().optional(),
  config: z.record(z.any()).optional(),
}).passthrough();

export const updateSectionSchema = sectionSchema.partial();
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

