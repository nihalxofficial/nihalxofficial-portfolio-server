import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createEntity,
  deleteEntity,
  describeEntities,
  listEntity,
  overview,
  patchEntity,
  readEntity,
} from "./content.controller";

/**
 * Admin content API.
 *
 * Everything under /api/v1/admin is protected by the Firebase allowlist.
 * Body validation is handled by Mongoose schema validators in the service layer.
 */

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.get("/overview", overview);
adminRouter.get("/content/describe", describeEntities);

adminRouter.get("/content/:entity", listEntity);
adminRouter.post("/content/:entity", createEntity);
adminRouter.patch("/content/:entity", patchEntity);

adminRouter.get("/content/:entity/:id", readEntity);
adminRouter.patch("/content/:entity/:id", patchEntity);
adminRouter.delete("/content/:entity/:id", deleteEntity);