import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { ContactMessageModel } from "./models";
import { createContent, getContent, listContent, removeContent, updateContent } from "./contact.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listContactMessages(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(ContactMessageModel, query);
  return sendResponse(res, 200, { message: "Messages loaded", data: items, meta });
}

export async function readContactMessage(req: Request, res: Response) {
  const data = await getContent(ContactMessageModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Message loaded", data });
}

export async function createContactMessage(req: Request, res: Response) {
  const data = await createContent(ContactMessageModel, req.body);
  return sendResponse(res, 201, { message: "Message created", data });
}

export async function updateContactMessage(req: Request, res: Response) {
  const data = await updateContent(ContactMessageModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Message updated", data });
}

export async function deleteContactMessage(req: Request, res: Response) {
  const data = await removeContent(ContactMessageModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Message deleted", data });
}