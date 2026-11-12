import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { AboutModel } from "./about.model";
import { createContent, getContent, listContent, removeContent, updateContent, updateSingleton } from "./about.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listAbout(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(AboutModel, query);
  return sendResponse(res, 200, { message: "About loaded", data: items, meta });
}

export async function readAbout(req: Request, res: Response) {
  const data = await getContent(AboutModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "About loaded", data });
}

export async function createAbout(req: Request, res: Response) {
  const data = await updateSingleton(AboutModel, req.body);
  return sendResponse(res, 201, { message: "About saved", data });
}

export async function updateAbout(req: Request, res: Response) {
  const data = await updateSingleton(AboutModel, req.body);
  return sendResponse(res, 200, { message: "About updated", data });
}

export async function deleteAbout(req: Request, res: Response) {
  return sendResponse(res, 400, { message: "About is a singleton and cannot be deleted" });
}