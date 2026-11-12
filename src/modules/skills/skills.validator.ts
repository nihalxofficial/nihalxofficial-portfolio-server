import { z } from "zod";

export const createSkillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  proficiency: z.number().min(0).max(100).optional(),
  icon: z.string().optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
}).passthrough();

export const updateSkillSchema = createSkillSchema.partial();
export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;

