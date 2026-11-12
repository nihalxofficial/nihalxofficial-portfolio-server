import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta, sendResponse } from "../../utils/sendResponse";
import {
  AboutModel,
  BlogPostModel,
  CertificationModel,
  ContactMessageModel,
  EducationModel,
  ExperienceModel,
  HeroModel,
  MediaAssetModel,
  NavigationModel,
  ProjectModel,
  SectionModel,
  ServiceModel,
  SiteSettingsModel,
  SkillModel,
  StatisticModel,
  TestimonialModel,
} from "./models";
import {
  createContent,
  getContent,
  getOverview,
  getSingleton,
  listContent,
  removeContent,
  updateContent,
  updateSingleton,
} from "./content.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

// Map entity keys to their Mongoose models (no central registry)
const ENTITY_MODELS: Record<string, any> = {
  hero: HeroModel,
  about: AboutModel,
  statistics: StatisticModel,
  services: ServiceModel,
  testimonials: TestimonialModel,
  navigation: NavigationModel,
  sections: SectionModel,
  settings: SiteSettingsModel,
  projects: ProjectModel,
  posts: BlogPostModel,
  certifications: CertificationModel,
  education: EducationModel,
  experience: ExperienceModel,
  skills: SkillModel,
};

// Singleton entities (single document, upsert instead of create)
const SINGLETONS = new Set(["hero", "about", "settings", "sections"]);

// Entity labels for user-facing messages
const ENTITY_LABELS: Record<string, string> = {
  hero: "Hero section",
  about: "About section",
  statistics: "Statistics",
  services: "Services",
  testimonials: "Testimonials",
  navigation: "Navigation",
  sections: "Sections",
  settings: "Site settings",
  projects: "Projects",
  posts: "Blog posts",
  certifications: "Certifications",
  education: "Education",
  experience: "Experience",
  skills: "Skills",
};

function resolveModel(entityKey: string) {
  const model = ENTITY_MODELS[entityKey];
  if (!model) throw ApiError.notFound(`Unknown content type "${entityKey}"`);
  return model;
}

/** The dashboard fetches this once to build every form and table. */
export function describeEntities(_req: Request, res: Response) {
  return sendResponse(res, 200, {
    message: "Content types",
    data: Object.keys(ENTITY_MODELS).map((key) => ({
      key,
      label: ENTITY_LABELS[key] || key,
      singleton: SINGLETONS.has(key),
    })),
  });
}

export async function listEntity(req: Request, res: Response) {
  const model = resolveModel(String(req.params.entity));
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(model, query);

  return sendResponse(res, 200, {
    message: "Content loaded",
    data: items,
    meta: buildPaginationMeta(meta.page, meta.limit, meta.total),
  });
}

export async function readEntity(req: Request, res: Response) {
  const model = resolveModel(String(req.params.entity));
  const data = await getContent(model, String(req.params.id ?? ""));

  return sendResponse(res, 200, { message: "Content loaded", data });
}

export async function createEntity(req: Request, res: Response) {
  const model = resolveModel(String(req.params.entity));
  const data = SINGLETONS.has(String(req.params.entity))
    ? await updateSingleton(model, req.body)
    : await createContent(model, req.body);

  return sendResponse(res, 201, {
    message: "Content saved",
    data,
  });
}

export async function patchEntity(req: Request, res: Response) {
  const model = resolveModel(String(req.params.entity));
  const key = String(req.params.entity);
  const data = SINGLETONS.has(key)
    ? await updateSingleton(model, req.body)
    : await updateContent(model, String(req.params.id ?? ""), req.body);

  return sendResponse(res, 200, { message: "Content updated", data });
}

export async function deleteEntity(req: Request, res: Response) {
  const model = resolveModel(String(req.params.entity));
  const data = await removeContent(model, String(req.params.id ?? ""));

  return sendResponse(res, 200, { message: "Content deleted", data });
}

export async function overview(_req: Request, res: Response) {
  const data = await getOverview();
  return sendResponse(res, 200, { message: "Dashboard overview", data });
}

export const adminParams = { listQuerySchema };