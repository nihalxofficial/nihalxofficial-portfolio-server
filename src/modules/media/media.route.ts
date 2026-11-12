import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createMediaAsset,
  deleteMediaAsset,
  listMedia,
  readMediaAsset,
  updateMediaAsset,
} from "./media.controller";

export const mediaRouter = Router();
mediaRouter.use(requireAuth, requireRole("admin"));

mediaRouter.get("/", listMedia);
mediaRouter.post("/", createMediaAsset);
mediaRouter.patch("/:id", updateMediaAsset);
mediaRouter.get("/:id", readMediaAsset);
mediaRouter.delete("/:id", deleteMediaAsset);