import { z } from "zod";

export const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
}).passthrough();

export const updatePostSchema = createPostSchema.partial();
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

