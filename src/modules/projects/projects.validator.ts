import { z } from "zod";

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  liveUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
}).passthrough();

export const updateProjectSchema = createProjectProjectSchemaPartials(createProjectSchema);

function createProjectProjectSchemaPartials(schema: typeof createProjectSchema) {
  return schema.partial();
}

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

