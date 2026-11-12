import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createExperience,
  deleteExperience,
  listExperience,
  readExperience,
  updateExperience,
} from "./experience.controller";

export const experienceRouter = Router();
experienceRouter.use(requireAuth, requireRole("admin"));

experienceRouter.get("/", listExperience);
experienceRouter.post("/", createExperience);
experienceRouter.patch("/:id", updateExperience);
experienceRouter.get("/:id", readExperience);
experienceRouter.delete("/:id", deleteExperience);