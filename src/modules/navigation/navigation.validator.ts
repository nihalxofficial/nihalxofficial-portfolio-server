import { z } from "zod";

export const navigationSchema = z.object({
  label: z.string().min(1, "Label is required"),
  href: z.string().min(1, "href is required"),
  external: z.boolean().optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
}).passthrough();

export const updateNavigationSchema = navigationSchema.partial();
export type UpdateNavigationInput = z.infer<typeof updateNavigationSchema>;

