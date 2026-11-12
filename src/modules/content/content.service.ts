import { Types } from "mongoose";
import { ProjectModel } from "../projects/projects.model";
import { BlogPostModel } from "../posts/posts.model";
import { SkillModel } from "../skills/skills.model";
import { ContactMessageModel } from "../contact/contact.model";
import { MediaAssetModel } from "../media/media.model";
import { SiteSettingsModel } from "../settings/settings.model";
import { NavigationModel } from "../navigation/navigation.model";
import { SectionModel } from "../sections/sections.model";
import { ApiError } from "../../utils/apiError";
import { parsePagination } from "../../utils/sendResponse";
import { type EntityDef, pickFields } from "./content.registry";

export interface ListContentOptions {
  page?: unknown;
  limit?: unknown;
  q?: unknown;
  sort?: unknown;
}

export interface ListContentResult {
  items: Record<string, unknown>[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest("Invalid identifier");
}

function resolveSort(entity: EntityDef, sort?: unknown): Record<string, 1 | -1> {
  if (typeof sort !== "string" || !sort.trim()) return entity.sort;

  const allowed = new Set([
    ...entity.fields.map((field) => field.name),
    "createdAt",
    "updatedAt",
  ]);

  const parsed: Record<string, 1 | -1> = {};
  for (const token of sort.split(",")) {
    const raw = token.trim();
    if (!raw) continue;
    const field = raw.startsWith("-") ? raw.slice(1) : raw;
    if (!allowed.has(field)) continue;
    parsed[field] = raw.startsWith("-") ? -1 : 1;
  }

  return Object.keys(parsed).length > 0 ? parsed : entity.sort;
}

function duplicateError(error: unknown): never {
  const code = (error as { code?: number }).code;
  if (code === 11000) {
    const field = Object.keys((error as { keyPattern?: Record<string, unknown> }).keyPattern ?? {})[0];
    throw ApiError.conflict(
      field ? `Another record already uses this ${field}` : "A record with these values already exists",
    );
  }
  throw error;
}

/** Fills the few values that must stay consistent before a write. */
function normalise(entity: EntityDef, data: Record<string, unknown>) {
  if ("slug" in data && typeof data.slug === "string") {
    data.slug = data.slug.toLowerCase();
  }

  if (entity.key === "posts") {
    const published = data.isPublished === true;
    if (published && data.publishedAt === undefined) data.publishedAt = new Date();
    if (data.isPublished === false) data.publishedAt = undefined;
  }

  return data;
}

export async function listContent(
  entity: EntityDef,
  options: ListContentOptions = {},
): Promise<ListContentResult> {
  const { page, limit, skip } = parsePagination(options as Record<string, unknown>, {
    page: 1,
    limit: 24,
  });

  const filter: Record<string, unknown> = {};
  const query = typeof options.q === "string" ? options.q.trim() : "";
  if (query && entity.search.length > 0) {
    const pattern = new RegExp(escapeRegex(query), "i");
    filter.$or = entity.search.map((field) => ({ [field]: pattern }));
  }

  const [items, total] = await Promise.all([
    entity.model
      .find(filter)
      .sort(resolveSort(entity, options.sort))
      .skip(skip)
      .limit(limit)
      .lean(),
    entity.model.countDocuments(filter),
  ]);

  return {
    items: items as Record<string, unknown>[],
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getContent(entity: EntityDef, id: string) {
  if (entity.singleton) {
    const doc = await entity.model.findOne().lean();
    if (!doc) throw ApiError.notFound(`${entity.label} has not been created yet`);
    return doc as Record<string, unknown>;
  }

  assertObjectId(id);
  const doc = await entity.model.findById(id).lean();
  if (!doc) throw ApiError.notFound(`${entity.label} record not found`);
  return doc as Record<string, unknown>;
}

export async function updateSingleton(entity: EntityDef, payload: Record<string, unknown>) {
  const data = normalise(entity, pickFields(entity.fields, payload));

  const doc = await entity.model
    .findOneAndUpdate({}, { $set: data }, { new: true, upsert: true, setDefaultsOnInsert: true })
    .lean();

  return doc as Record<string, unknown>;
}

export async function createContent(entity: EntityDef, payload: Record<string, unknown>) {
  if (entity.singleton) return updateSingleton(entity, payload);

  const data = normalise(entity, pickFields(entity.fields, payload));

  try {
    const created = await entity.model.create(data);
    return created.toObject() as Record<string, unknown>;
  } catch (error) {
    duplicateError(error);
  }
}

export async function updateContent(
  entity: EntityDef,
  id: string,
  payload: Record<string, unknown>,
) {
  if (entity.singleton) return updateSingleton(entity, payload);

  assertObjectId(id);
  const data = normalise(entity, pickFields(entity.fields, payload));
  if (Object.keys(data).length === 0) throw ApiError.badRequest("No valid fields to update");

  try {
    const doc = await entity.model
      .findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
      .lean();
    if (!doc) throw ApiError.notFound(`${entity.label} record not found`);
    return doc as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    duplicateError(error);
  }
}

export async function removeContent(entity: EntityDef, id: string) {
  if (entity.singleton) {
    throw ApiError.badRequest(`${entity.label} is a single document and cannot be deleted`);
  }

  assertObjectId(id);
  const doc = await entity.model.findByIdAndDelete(id).lean();
  if (!doc) throw ApiError.notFound(`${entity.label} record not found`);
  return { id };
}

// ─── Dashboard Overview ──────────────────────────────────────────────────────

export async function getOverview() {
  const [
    projects,
    publishedProjects,
    featuredProjects,
    posts,
    publishedPosts,
    skills,
    messages,
    unreadMessages,
    media,
  ] = await Promise.all([
    ProjectModel.countDocuments({}),
    ProjectModel.countDocuments({ isPublished: true }),
    ProjectModel.countDocuments({ isFeatured: true }),
    BlogPostModel.countDocuments({}),
    BlogPostModel.countDocuments({ isPublished: true }),
    SkillModel.countDocuments({}),
    ContactMessageModel.countDocuments({}),
    ContactMessageModel.countDocuments({ status: "unread" }),
    MediaAssetModel.find({}).select("sizeBytes").lean(),
  ]);

  const [recentProjects, recentMessages, settings] = await Promise.all([
    ProjectModel.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    ContactMessageModel.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    SiteSettingsModel.findOne({ key: "main" }).lean(),
  ]);

  return {
    counts: {
      projects,
      publishedProjects,
      featuredProjects,
      posts,
      publishedPosts,
      skills,
      messages,
      unreadMessages,
      media: media.length,
      mediaBytes: media.reduce((sum, item) => sum + (item.sizeBytes ?? 0), 0),
    },
    recentProjects,
    recentMessages,
    siteName: settings?.siteName ?? "",
  };
}

// ─── Navigation Reorder ──────────────────────────────────────────────────────

export async function reorderNavigationItems(items: Array<{ id?: string; _id?: string; order: number }>) {
  const operations = items
    .filter((item) => item.id || item._id)
    .map((item) => {
      const id = item._id || item.id;
      return {
        updateOne: {
          filter: { _id: new Types.ObjectId(id) },
          update: { $set: { order: item.order } },
        },
      };
    });

  if (operations.length > 0) {
    await NavigationModel.bulkWrite(operations);
  }

  return NavigationModel.find({}).sort({ order: 1 }).lean();
}

// ─── Component Visibility ───────────────────────────────────────────────────

export async function getComponentVisibility() {
  const sections = await SectionModel.find({}).sort({ order: 1 }).lean();
  return sections.map((s: any) => ({
    _id: String(s._id),
    componentKey: s.key,
    label: s.label || s.key,
    description: s.description || "",
    isVisible: s.isVisible !== false,
    order: s.order || 0,
    hasManagementPage: true,
  }));
}

export async function updateComponentVisibility(componentKey: string, isVisible: boolean) {
  const section = await SectionModel.findOneAndUpdate(
    { key: componentKey },
    { $set: { isVisible } },
    { new: true },
  ).lean();
  return section;
}

