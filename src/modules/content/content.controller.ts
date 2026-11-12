import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta, sendResponse } from "../../utils/sendResponse";
import { ENTITY_KEYS, getEntity } from "./content.registry";
import {
  createContent,
  getComponentVisibility,
  getContent,
  getOverview,
  listContent,
  removeContent,
  reorderNavigationItems,
  updateComponentVisibility,
  updateContent,
} from "./content.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

function resolve(entityKey: string) {
  const entity = getEntity(entityKey);
  if (!entity) throw ApiError.notFound(`Unknown content type "${entityKey}"`);
  return entity;
}

/** The dashboard fetches this once to build every form and table. */
export function describeEntities(_req: Request, res: Response) {
  return sendResponse(res, 200, {
    message: "Content types",
    data: ENTITY_KEYS.map((key) => {
      const entity = resolve(key);
      return {
        key: entity.key,
        label: entity.label,
        singleton: Boolean(entity.singleton),
        titleField: entity.titleField,
        fields: entity.fields,
      };
    }),
  });
}

export async function listEntity(req: Request, res: Response) {
  const entity = resolve(String(req.params.entity));
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(entity, query);

  return sendResponse(res, 200, {
    message: `${entity.label} loaded`,
    data: items,
    meta: buildPaginationMeta(meta.page, meta.limit, meta.total),
  });
}

export async function readEntity(req: Request, res: Response) {
  const entity = resolve(String(req.params.entity));
  const data = await getContent(entity, String(req.params.id ?? ""));

  return sendResponse(res, 200, { message: `${entity.label} loaded`, data });
}

export async function createEntity(req: Request, res: Response) {
  const entity = resolve(String(req.params.entity));
  const data = await createContent(entity, req.body);

  return sendResponse(res, 201, {
    message: entity.singleton ? `${entity.label} saved` : `${entity.label} record created`,
    data,
  });
}

export async function patchEntity(req: Request, res: Response) {
  const entity = resolve(String(req.params.entity));
  const data = await updateContent(entity, String(req.params.id ?? ""), req.body);

  return sendResponse(res, 200, { message: `${entity.label} updated`, data });
}

export async function deleteEntity(req: Request, res: Response) {
  const entity = resolve(String(req.params.entity));
  const data = await removeContent(entity, String(req.params.id ?? ""));

  return sendResponse(res, 200, { message: `${entity.label} record deleted`, data });
}

export async function overview(_req: Request, res: Response) {
  const data = await getOverview();
  return sendResponse(res, 200, { message: "Dashboard overview", data });
}

export async function reorderNav(req: Request, res: Response) {
  const items = req.body?.items || req.body;
  if (!Array.isArray(items)) {
    throw ApiError.badRequest("Items array is required");
  }
  const data = await reorderNavigationItems(items);
  return sendResponse(res, 200, { message: "Navigation reordered", data });
}

export async function getVisibility(_req: Request, res: Response) {
  const data = await getComponentVisibility();
  return sendResponse(res, 200, { message: "Component visibility loaded", data });
}

export async function patchVisibility(req: Request, res: Response) {
  const { componentKey } = req.params;
  const { isVisible } = req.body;
  const data = await updateComponentVisibility(String(componentKey), Boolean(isVisible));
  return sendResponse(res, 200, { message: "Component visibility updated", data });
}

