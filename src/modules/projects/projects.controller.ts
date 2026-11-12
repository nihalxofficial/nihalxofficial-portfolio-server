import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { ProjectModel } from "./models";
import { createContent, getContent, listContent, removeContent, updateContent } from "./projects.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listProjects(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(ProjectModel, query);
  return sendResponse(res, 200, { message: "Projects loaded", data: items, meta });
}

export async function readProject(req: Request, res: Response) {
  const data = await getContent(ProjectModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Project loaded", data });
}

export async function createProject(req: Request, res: Response) {
  const data = await createContent(ProjectModel, req.body);
  return sendResponse(res, 201, { message: "Project created", data });
}

export async function updateProject(req: Request, res: Response) {
  const data = await updateContent(ProjectModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Project updated", data });
}

export async function deleteProject(req: Request, res: Response) {
  const data = await removeContent(ProjectModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Project deleted", data });
}