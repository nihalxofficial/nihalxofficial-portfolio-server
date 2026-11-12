import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { EducationModel } from "./models";
import { createContent, getContent, listContent, removeContent, updateContent } from "./education.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listEducation(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(EducationModel, query);
  return sendResponse(res, 200, { message: "Education loaded", data: items, meta });
}

export async function readEducation(req: Request, res: Response) {
  const data = await getContent(EducationModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Education loaded", data });
}

export async function createEducation(req: Request, res: Response) {
  const data = await createContent(EducationModel, req.body);
  return sendResponse(res, 201, { message: "Education created", data });
}

export async function updateEducation(req: Request, res: Response) {
  const data = await updateContent(EducationModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Education updated", data });
}

export async function deleteEducation(req: Request, res: Response) {
  const data = await removeContent(EducationModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Education deleted", data });
}