import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { TestimonialModel } from "./testimonials.model";
import { createContent, getContent, listContent, removeContent, updateContent } from "./testimonials.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listTestimonials(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(TestimonialModel, query);
  return sendResponse(res, 200, { message: "Testimonials loaded", data: items, meta });
}

export async function readTestimonial(req: Request, res: Response) {
  const data = await getContent(TestimonialModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Testimonial loaded", data });
}

export async function createTestimonial(req: Request, res: Response) {
  const data = await createContent(TestimonialModel, req.body);
  return sendResponse(res, 201, { message: "Testimonial created", data });
}

export async function updateTestimonial(req: Request, res: Response) {
  const data = await updateContent(TestimonialModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Testimonial updated", data });
}

export async function deleteTestimonial(req: Request, res: Response) {
  const data = await removeContent(TestimonialModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Testimonial deleted", data });
}