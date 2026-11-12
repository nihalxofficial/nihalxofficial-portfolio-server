import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { SiteSettingsModel } from "./settings.model";
import { createContent, getContent, listContent, removeContent, updateContent, updateSingleton } from "./settings.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listSettings(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(SiteSettingsModel, query);
  return sendResponse(res, 200, { message: "Settings loaded", data: items, meta });
}

export async function readSettings(req: Request, res: Response) {
  const data = await getContent(SiteSettingsModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Settings loaded", data });
}

export async function createSettings(req: Request, res: Response) {
  const data = await updateSingleton(SiteSettingsModel, req.body);
  return sendResponse(res, 201, { message: "Settings saved", data });
}

export async function updateSettings(req: Request, res: Response) {
  const data = await updateSingleton(SiteSettingsModel, req.body);
  return sendResponse(res, 200, { message: "Settings updated", data });
}

export async function deleteSettings(req: Request, res: Response) {
  return sendResponse(res, 400, { message: "Settings is a singleton and cannot be deleted" });
}