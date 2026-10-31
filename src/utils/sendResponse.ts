import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  /** Inbox only: how many messages are still unread, across every filter. */
  unreadCount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
}

export function sendResponse<T>(
  res: Response,
  statusCode: number,
  payload: { message?: string; data?: T; meta?: PaginationMeta },
): Response {
  const body: ApiResponse<T> = {
    success: true,
    message: payload.message ?? "Request successful",
  };

  if (payload.data !== undefined) body.data = payload.data;
  if (payload.meta) body.meta = payload.meta;

  return res.status(statusCode).json(body);
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function parsePagination(query: Record<string, unknown>, defaults = { page: 1, limit: 12 }) {
  const page = Math.max(1, Number(query.page) || defaults.page);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || defaults.limit));
  return { page, limit, skip: (page - 1) * limit };
}
