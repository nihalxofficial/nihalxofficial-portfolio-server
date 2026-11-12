import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { ExperienceModel } from "./models";
import { createContent, getContent, listContent, removeContent, updateContent } from "./experience.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listExperience(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(ExperienceModel, query);
  return sendResponse(res, 200, { message: "Experience loaded", data: items, meta });
}

export async function readExperience(req: Request, res: Response) {
  const data = await getContent(ExperienceModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Experience loaded", data });
}

export async function createExperience(req: Request, res: Response) {
  const data = await createContent(ExperienceModel, req.body);
  return sendResponse(res, 201, { message: "Experience created", data });
}

export async function updateExperience(req: Request, res: Response) {
  const data = await updateContent(ExperienceModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Experience updated", data });
}

export async function deleteExperience(req: Request, res: Response) {
  const data = await removeContent(ExperienceModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Experience deleted", data });
}