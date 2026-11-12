import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createExperience,
  deleteExperience,
  listExperience,
  readExperience,
  updateExperience,
} from "./experience.controller";

export const experienceRouter = Router();
experienceRouter.use(requireAdmin);

experienceRouter.get("/", listExperience);
experienceRouter.post("/", createExperience);
experienceRouter.patch("/:id", updateExperience);
experienceRouter.get("/:id", readExperience);
experienceRouter.delete("/:id", deleteExperience);