import { Router, type RequestHandler } from "express";
import { ZodError } from "zod";
import { requireAdmin } from "../../middlewares/auth";
import { ApiError } from "../../utils/apiError";
import { createEntity, deleteEntity, describeEntities, listEntity, overview, patchEntity, readEntity } from "./content.controller";
import { createSchemaFor, getEntity, updateSchemaFor } from "./content.registry";

/**
 * Admin content API.
 *
 * Everything under /api/v1/admin is protected by the Firebase allowlist.
 * The body schema is chosen per entity so a single pair of routes serves the
 * whole dashboard without ever trusting client supplied field names.
 */

const validateBody =
  (mode: "create" | "update"): RequestHandler =>
  (req, _res, next) => {
    try {
      const entity = getEntity(String(req.params.entity));
      if (!entity) throw ApiError.notFound(`Unknown content type "${String(req.params.entity)}"`);

      const schema = mode === "create" ? createSchemaFor(entity) : updateSchemaFor(entity);
      req.body = schema.parse(req.body ?? {});
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new ApiError(
            422,
            "Validation failed",
            error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          ),
        );
        return;
      }
      next(error);
    }
  };

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.get("/overview", overview);
adminRouter.get("/content/describe", describeEntities);

adminRouter.get("/content/:entity", listEntity);
adminRouter.post("/content/:entity", validateBody("create"), createEntity);
adminRouter.patch("/content/:entity", validateBody("update"), patchEntity);

adminRouter.get("/content/:entity/:id", readEntity);
adminRouter.patch("/content/:entity/:id", validateBody("update"), patchEntity);
adminRouter.delete("/content/:entity/:id", deleteEntity);
