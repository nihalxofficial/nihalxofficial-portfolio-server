import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createSettings,
  deleteSettings,
  listSettings,
  readSettings,
  updateSettings,
} from "./settings.controller";

export const settingsRouter = Router();
settingsRouter.use(requireAuth, requireRole("admin"));

settingsRouter.get("/", listSettings);
settingsRouter.post("/", createSettings);
settingsRouter.patch("/:id", updateSettings);
settingsRouter.get("/:id", readSettings);
settingsRouter.delete("/:id", deleteSettings);