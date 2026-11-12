import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createSettings,
  deleteSettings,
  listSettings,
  readSettings,
  updateSettings,
} from "./settings.controller";

export const settingsRouter = Router();
settingsRouter.use(requireAdmin);

settingsRouter.get("/", listSettings);
settingsRouter.post("/", createSettings);
settingsRouter.patch("/:id", updateSettings);
settingsRouter.get("/:id", readSettings);
settingsRouter.delete("/:id", deleteSettings);