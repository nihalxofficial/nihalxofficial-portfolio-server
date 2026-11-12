import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createSkill,
  deleteSkill,
  listSkills,
  readSkill,
  updateSkill,
} from "./skills.controller";

export const skillsRouter = Router();
skillsRouter.use(requireAuth, requireRole("admin"));

skillsRouter.get("/", listSkills);
skillsRouter.post("/", createSkill);
skillsRouter.patch("/:id", updateSkill);
skillsRouter.get("/:id", readSkill);
skillsRouter.delete("/:id", deleteSkill);