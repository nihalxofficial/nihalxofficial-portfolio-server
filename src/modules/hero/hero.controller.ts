import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { HeroModel } from "./hero.model";
import { createContent, getContent, listContent, removeContent, updateContent, updateSingleton } from "./hero.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listHero(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(HeroModel, query);
  return sendResponse(res, 200, { message: "Hero loaded", data: items, meta });
}

export async function readHero(req: Request, res: Response) {
  const data = await getContent(HeroModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Hero loaded", data });
}

export async function createHero(req: Request, res: Response) {
  const data = await updateSingleton(HeroModel, req.body);
  return sendResponse(res, 201, { message: "Hero saved", data });
}

export async function updateHero(req: Request, res: Response) {
  const data = await updateSingleton(HeroModel, req.body);
  return sendResponse(res, 200, { message: "Hero updated", data });
}

export async function deleteHero(req: Request, res: Response) {
  return sendResponse(res, 400, { message: "Hero is a singleton and cannot be deleted" });
}