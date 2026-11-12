import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createSection,
  deleteSection,
  listSections,
  readSection,
  updateSection,
} from "./sections.controller";

export const sectionsRouter = Router();
sectionsRouter.use(requireAdmin);

sectionsRouter.get("/", listSections);
sectionsRouter.post("/", createSection);
sectionsRouter.patch("/:id", updateSection);
sectionsRouter.get("/:id", readSection);
sectionsRouter.delete("/:id", deleteSection);