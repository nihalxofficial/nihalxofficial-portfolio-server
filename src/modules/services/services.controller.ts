import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { ServiceModel } from "./models";
import { createContent, getContent, listContent, removeContent, updateContent } from "./services.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listServices(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(ServiceModel, query);
  return sendResponse(res, 200, { message: "Services loaded", data: items, meta });
}

export async function readService(req: Request, res: Response) {
  const data = await getContent(ServiceModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Service loaded", data });
}

export async function createService(req: Request, res: Response) {
  const data = await createContent(ServiceModel, req.body);
  return sendResponse(res, 201, { message: "Service created", data });
}

export async function updateService(req: Request, res: Response) {
  const data = await updateContent(ServiceModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Service updated", data });
}

export async function deleteService(req: Request, res: Response) {
  const data = await removeContent(ServiceModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Service deleted", data });
}