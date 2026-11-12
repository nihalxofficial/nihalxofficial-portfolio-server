import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { StatisticModel } from "./statistics.model";
import { createContent, getContent, listContent, removeContent, updateContent } from "./statistics.service";

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  sort: z.string().trim().max(120).optional(),
});

export async function listStatistics(req: Request, res: Response) {
  const query = listQuerySchema.parse(req.query);
  const { items, meta } = await listContent(StatisticModel, query);
  return sendResponse(res, 200, { message: "Statistics loaded", data: items, meta });
}

export async function readStatistic(req: Request, res: Response) {
  const data = await getContent(StatisticModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Statistic loaded", data });
}

export async function createStatistic(req: Request, res: Response) {
  const data = await createContent(StatisticModel, req.body);
  return sendResponse(res, 201, { message: "Statistic created", data });
}

export async function updateStatistic(req: Request, res: Response) {
  const data = await updateContent(StatisticModel, String(req.params.id ?? ""), req.body);
  return sendResponse(res, 200, { message: "Statistic updated", data });
}

export async function deleteStatistic(req: Request, res: Response) {
  const data = await removeContent(StatisticModel, String(req.params.id ?? ""));
  return sendResponse(res, 200, { message: "Statistic deleted", data });
}