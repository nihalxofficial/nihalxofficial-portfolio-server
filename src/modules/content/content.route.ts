import { Router, type RequestHandler } from "express";
import { ZodError } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { ApiError } from "../../utils/apiError";
import {
  createEntity,
  deleteEntity,
  describeEntities,
  getVisibility,
  listEntity,
  overview,
  patchEntity,
  patchVisibility,
  readEntity,
  reorderNav,
} from "./content.controller";
import { createSchemaFor, getEntity, updateSchemaFor } from "./content.registry";

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

export const contentRouter = Router();
contentRouter.use(requireAuth, requireRole("admin"));

// Dashboard Overview & Content Description
contentRouter.get("/overview", overview);
contentRouter.get("/content/describe", describeEntities);

// Navigation Reordering & Components Visibility
contentRouter.post("/navigation/reorder", reorderNav);
contentRouter.get("/components/visibility", getVisibility);
contentRouter.patch("/components/visibility/:componentKey", patchVisibility);

// Generic Content CRUD
contentRouter.get("/content/:entity", listEntity);
contentRouter.post("/content/:entity", validateBody("create"), createEntity);
contentRouter.patch("/content/:entity", validateBody("update"), patchEntity);

contentRouter.get("/content/:entity/:id", readEntity);
contentRouter.patch("/content/:entity/:id", validateBody("update"), patchEntity);
contentRouter.delete("/content/:entity/:id", deleteEntity);
