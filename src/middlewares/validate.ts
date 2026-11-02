import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { ApiError } from "../utils/apiError";

interface ValidateOptions {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/** Replaces the request section with the parsed (and coerced) value. */
export const validate =
  (schemas: ValidateOptions): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.defineProperty(req, "params", { value: parsed, writable: true, configurable: true });
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // Express 5 exposes req.query through a getter with no setter, so a
        // plain `req.query = ...` throws. Shadow it with an own property.
        Object.defineProperty(req, "query", { value: parsed, writable: true, configurable: true });
      }
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        next(new ApiError(422, "Validation failed", details));
        return;
      }
      next(error);
    }
  };
