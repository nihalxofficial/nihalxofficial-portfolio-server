import type { Request, Response } from "express";

export function notFound(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
}

export const notFoundHandler = notFound;

