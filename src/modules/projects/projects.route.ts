import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createProject,
  deleteProject,
  listProjects,
  readProject,
  updateProject,
} from "./projects.controller";

export const projectsRouter = Router();
projectsRouter.use(requireAuth, requireRole("admin"));

projectsRouter.get("/", listProjects);
projectsRouter.post("/", createProject);
projectsRouter.patch("/:id", updateProject);
projectsRouter.get("/:id", readProject);
projectsRouter.delete("/:id", deleteProject);