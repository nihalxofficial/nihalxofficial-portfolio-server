import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { CertificationModel } from "./certifications.model";
import { createContent, getContent, listContent, removeContent, updateContent } from "./certifications.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listCertifications(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(CertificationModel, query);
  return sendResponse(res, 200, { message: "Certifications loaded", data: items, meta });
}

export async function readCertification(req: Request, res: Response) {
  const data = await getContent(CertificationModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Certification loaded", data });
}

export async function createCertification(req: Request, res: Response) {
  const data = await createContent(CertificationModel, req.body);
  return sendResponse(res, 201, { message: "Certification created", data });
}

export async function updateCertification(req: Request, res: Response) {
  const data = await updateContent(CertificationModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Certification updated", data });
}

export async function deleteCertification(req: Request, res: Response) {
  const data = await removeContent(CertificationModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Certification deleted", data });
}