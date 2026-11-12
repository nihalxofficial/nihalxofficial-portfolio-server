import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { MediaAssetModel } from "./media.model";
import { createContent, getContent, listContent, removeContent, updateContent } from "./media.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listMedia(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(MediaAssetModel, query);
  return sendResponse(res, 200, { message: "Media loaded", data: items, meta });
}

export async function readMediaAsset(req: Request, res: Response) {
  const data = await getContent(MediaAssetModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Media loaded", data });
}

export async function createMediaAsset(req: Request, res: Response) {
  const data = await createContent(MediaAssetModel, req.body);
  return sendResponse(res, 201, { message: "Media created", data });
}

export async function updateMediaAsset(req: Request, res: Response) {
  const data = await updateContent(MediaAssetModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Media updated", data });
}

export async function deleteMediaAsset(req: Request, res: Response) {
  const data = await removeContent(MediaAssetModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Media deleted", data });
}