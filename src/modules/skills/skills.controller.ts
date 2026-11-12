import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { SkillModel } from "./models";
import { createContent, getContent, listContent, removeContent, updateContent } from "./skills.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listSkills(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(SkillModel, query);
  return sendResponse(res, 200, { message: "Skills loaded", data: items, meta });
}

export async function readSkill(req: Request, res: Response) {
  const data = await getContent(SkillModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Skill loaded", data });
}

export async function createSkill(req: Request, res: Response) {
  const data = await createContent(SkillModel, req.body);
  return sendResponse(res, 201, { message: "Skill created", data });
}

export async function updateSkill(req: Request, res: Response) {
  const data = await updateContent(SkillModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Skill updated", data });
}

export async function deleteSkill(req: Request, res: Response) {
  const data = await removeContent(SkillModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Skill deleted", data });
}