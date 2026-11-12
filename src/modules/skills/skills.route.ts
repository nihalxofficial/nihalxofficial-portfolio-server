import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createSkill,
  deleteSkill,
  listSkills,
  readSkill,
  updateSkill,
} from "./skills.controller";

export const skillsRouter = Router();
skillsRouter.use(requireAdmin);

skillsRouter.get("/", listSkills);
skillsRouter.post("/", createSkill);
skillsRouter.patch("/:id", updateSkill);
skillsRouter.get("/:id", readSkill);
skillsRouter.delete("/:id", deleteSkill);