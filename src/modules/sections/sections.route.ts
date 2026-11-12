import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createSection,
  deleteSection,
  listSections,
  readSection,
  updateSection,
} from "./sections.controller";

export const sectionsRouter = Router();
sectionsRouter.use(requireAuth, requireRole("admin"));

sectionsRouter.get("/", listSections);
sectionsRouter.post("/", createSection);
sectionsRouter.patch("/:id", updateSection);
sectionsRouter.get("/:id", readSection);
sectionsRouter.delete("/:id", deleteSection);