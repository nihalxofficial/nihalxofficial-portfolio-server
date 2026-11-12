import { z } from "zod";

export const siteSettingsSchema = z.object({
  siteName: z.string().optional(),
  siteUrl: z.string().optional(),
  theme: z.record(z.any()).optional(),
  typography: z.record(z.any()).optional(),
  branding: z.record(z.any()).optional(),
  seo: z.record(z.any()).optional(),
  contact: z.record(z.any()).optional(),
}).passthrough();

export const updateSiteSettingsSchema = siteSettingsSchema.partial();
export type UpdateSiteSettingsInput = z.infer<typeof updateSiteSettingsSchema>;

