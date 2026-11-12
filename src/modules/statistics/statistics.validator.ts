import { z } from "zod";

export const createStatisticSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.string().or(z.number()),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
}).passthrough();

export const updateStatisticSchema = createStatisticSchema.partial();
export type CreateStatisticInput = z.infer<typeof createStatisticSchema>;
export type UpdateStatisticInput = z.infer<typeof updateStatisticSchema>;

