import { z } from "zod";

export const aboutSchema = z.object({
  heading: z.string().optional(),
  paragraphs: z.array(z.string()).optional(),
  portraitUrl: z.string().optional(),
  codeCard: z.record(z.any()).optional(),
  highlights: z.array(z.record(z.any())).optional(),
  signature: z.string().optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
}).passthrough();

export const updateAboutSchema = aboutSchema.partial();
export type UpdateAboutInput = z.infer<typeof updateAboutSchema>;

