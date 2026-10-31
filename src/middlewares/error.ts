import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  let statusCode = 500;
  let message = "Something went wrong";
  let details: unknown;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
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
    const keys = Object.keys((error as { keyValue?: Record<string, unknown> }).keyValue ?? {});
    message = keys.length
      ? `A record with this ${keys.join(", ")} already exists`
      : "Duplicate record";
  } else if (error instanceof Error) {
    message = env.isProduction ? "Internal server error" : error.message;
  }

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error("[error]", error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(env.isProduction ? {} : { stack: (error as Error)?.stack }),
  });
};

export const notFoundHandler = (req: { originalUrl: string }, res: { status: (n: number) => any }) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
