import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { NavigationModel } from "./navigation.model";
import { createContent, getContent, listContent, removeContent, updateContent } from "./navigation.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listNavigation(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(NavigationModel, query);
  return sendResponse(res, 200, { message: "Navigation loaded", data: items, meta });
}

export async function readNavigationItem(req: Request, res: Response) {
  const data = await getContent(NavigationModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Navigation item loaded", data });
}

export async function createNavigationItem(req: Request, res: Response) {
  const data = await createContent(NavigationModel, req.body);
  return sendResponse(res, 201, { message: "Navigation item created", data });
}

export async function updateNavigationItem(req: Request, res: Response) {
  const data = await updateContent(NavigationModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Navigation item updated", data });
}

export async function deleteNavigationItem(req: Request, res: Response) {
  const data = await removeContent(NavigationModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Navigation item deleted", data });
}