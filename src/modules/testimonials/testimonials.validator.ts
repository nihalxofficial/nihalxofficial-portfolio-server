import { z } from "zod";

export const createTestimonialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().optional(),
  company: z.string().optional(),
  quote: z.string().min(1, "Quote is required"),
  avatarUrl: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
}).passthrough();

export const updateTestimonialSchema = createTestimonialSchema.partial();
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;

