import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createMediaAsset,
  deleteMediaAsset,
  listMedia,
  readMediaAsset,
  updateMediaAsset,
} from "./media.controller";

export const mediaRouter = Router();
mediaRouter.use(requireAdmin);

mediaRouter.get("/", listMedia);
mediaRouter.post("/", createMediaAsset);
mediaRouter.patch("/:id", updateMediaAsset);
mediaRouter.get("/:id", readMediaAsset);
mediaRouter.delete("/:id", deleteMediaAsset);