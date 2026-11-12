import { Types } from "mongoose";
import { BlogPostModel } from "./posts.model";
import { ApiError } from "../../utils/apiError";
import { parsePagination } from "../../utils/sendResponse";

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

export async function listContent(
  model: any,
  options: ListContentOptions = {},
): Promise<ListContentResult> {
  const { page, limit, skip } = parsePagination(options as Record<string, unknown>, {
    page: 1,
    limit: 24,
  });

  const filter: Record<string, unknown> = {};
  const query = typeof options.q === "string" ? options.q.trim() : "";

  if (query) {
    const pattern = new RegExp(escapeRegex(query), "i");
    filter.$or = [
      { title: pattern },
      { name: pattern },
      { label: pattern },
      { slug: pattern },
      { role: pattern },
      { organization: pattern },
      { degree: pattern },
      { issuer: pattern },
      { category: pattern },
      { techStack: { $in: [pattern] } },
      { features: { $in: [pattern] } },
      { skills: { $in: [pattern] } },
      { tags: { $in: [pattern] } },
    ];
  }

  const defaultSort: Record<string, 1 | -1> = { order: 1, createdAt: -1 };
  const sort = options.sort
    ? (() => {
        const parsed: Record<string, 1 | -1> = {};
        const allowed = new Set([
          "title", "name", "label", "slug", "role", "organization",
          "degree", "issuer", "category", "order", "createdAt", "updatedAt",
        ]);
        for (const token of String(options.sort).split(",")) {
          const raw = token.trim();
          if (!raw) continue;
          const field = raw.startsWith("-") ? raw.slice(1) : raw;
          if (!allowed.has(field)) continue;
          parsed[field] = raw.startsWith("-") ? -1 : 1;
        }
        return Object.keys(parsed).length > 0 ? parsed : defaultSort;
      })()
    : defaultSort;

  const [items, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    model.countDocuments(filter),
  ]);

  return {
    items: items as Record<string, unknown>[],
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getContent(model: any, id: string) {
  assertObjectId(id);
  const doc = await model.findById(id).lean();
  if (!doc) throw ApiError.notFound("Record not found");
  return doc as Record<string, unknown>;
}

export async function createContent(model: any, payload: Record<string, unknown>) {
  const created = await model.create(payload);
  return created.toObject() as Record<string, unknown>;
}

export async function updateContent(
  model: any,
  id: string,
  payload: Record<string, unknown>,
) {
  assertObjectId(id);
  const { _id, ...updateData } = payload;
  if (Object.keys(updateData).length === 0) throw ApiError.badRequest("No valid fields to update");

  const doc = await model
    .findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
    .lean();
  if (!doc) throw ApiError.notFound("Record not found");
  return doc as Record<string, unknown>;
}

export async function removeContent(model: any, id: string) {
  assertObjectId(id);
  const doc = await model.findByIdAndDelete(id).lean();
  if (!doc) throw ApiError.notFound("Record not found");
  return { id };
}

export async function updateSingleton(model: any, payload: Record<string, unknown>) {
  const doc = await model
    .findOneAndUpdate({}, { $set: payload }, { new: true, upsert: true, setDefaultsOnInsert: true })
    .lean();
  return doc as Record<string, unknown>;
}