import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let statusCode = 500;
  let message = "Something went wrong";
  let details: unknown;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = (error as any).details;
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${error.path}`;
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = "Validation failed";
    details = Object.values(error.errors).map((issue) => ({
      field: issue.path,
      message: issue.message,
    }));
  } else if ((error as { code?: number }).code === 11000) {
    statusCode = 409;
    const keys = Object.keys(
      (error as { keyValue?: Record<string, unknown> }).keyValue ?? {},
    );
    message = keys.length
      ? `A record with this ${keys.join(", ")} already exists`
      : "Duplicate record";
  } else if (error instanceof Error) {
    message = env.isProduction ? "Internal server error" : error.message;
  }

  if (statusCode >= 500) {
    console.error("[error]", error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProduction ? {} : { stack: (error as Error)?.stack }),
  });
}

export const errorHandler = errorMiddleware;

