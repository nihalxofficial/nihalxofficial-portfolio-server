import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount?: number;
}

export function apiResponse(res: Response, statusCode: number, data: unknown, message = "Success", meta?: PaginationMeta) {
  const body: { success: boolean; message: string; data?: unknown; meta?: PaginationMeta } = {
    success: statusCode >= 200 && statusCode < 300,
    message,
  };
  if (data !== undefined) body.data = data;
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export function sendResponse<T>(
  res: Response,
  statusCode: number,
  payload: { message?: string; data?: T; meta?: PaginationMeta },
): Response {
  return apiResponse(res, statusCode, payload.data, payload.message ?? "Request successful", payload.meta);
}

