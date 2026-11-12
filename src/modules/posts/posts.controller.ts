import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { BlogPostModel } from "./models";
import { createContent, getContent, listContent, removeContent, updateContent } from "./posts.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listPosts(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(BlogPostModel, query);
  return sendResponse(res, 200, { message: "Posts loaded", data: items, meta });
}

export async function readPost(req: Request, res: Response) {
  const data = await getContent(BlogPostModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Post loaded", data });
}

export async function createPost(req: Request, res: Response) {
  const data = await createContent(BlogPostModel, req.body);
  return sendResponse(res, 201, { message: "Post created", data });
}

export async function updatePost(req: Request, res: Response) {
  const data = await updateContent(BlogPostModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Post updated", data });
}

export async function deletePost(req: Request, res: Response) {
  const data = await removeContent(BlogPostModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Post deleted", data });
}