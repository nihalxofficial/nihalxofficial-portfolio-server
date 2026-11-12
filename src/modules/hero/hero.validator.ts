import { z } from "zod";

export const heroSchema = z.object({
  greeting: z.string().optional(),
  name: z.string().optional(),
  title: z.string().optional(),
  tagline: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
  resumeUrl: z.string().optional(),
  socialLinks: z.array(z.record(z.any())).optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
}).passthrough();

export const updateHeroSchema = heroSchema.partial();
export type UpdateHeroInput = z.infer<typeof updateHeroSchema>;

