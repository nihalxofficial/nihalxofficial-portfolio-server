import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { SectionModel } from "./models";
import { createContent, getContent, listContent, removeContent, updateContent } from "./sections.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listSections(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(SectionModel, query);
  return sendResponse(res, 200, { message: "Sections loaded", data: items, meta });
}

export async function readSection(req: Request, res: Response) {
  const data = await getContent(SectionModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Section loaded", data });
}

export async function createSection(req: Request, res: Response) {
  const data = await createContent(SectionModel, req.body);
  return sendResponse(res, 201, { message: "Section created", data });
}

export async function updateSection(req: Request, res: Response) {
  const data = await updateContent(SectionModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Section updated", data });
}

export async function deleteSection(req: Request, res: Response) {
  const data = await removeContent(SectionModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Section deleted", data });
}