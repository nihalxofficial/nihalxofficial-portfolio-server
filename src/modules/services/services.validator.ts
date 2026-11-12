import { z } from "zod";

export const createServiceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  features: z.array(z.string()).optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
}).passthrough();

export const updateServiceSchema = createServiceSchema.partial();
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

