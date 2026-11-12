import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createProject,
  deleteProject,
  listProjects,
  readProject,
  updateProject,
} from "./projects.controller";

export const projectsRouter = Router();
projectsRouter.use(requireAdmin);

projectsRouter.get("/", listProjects);
projectsRouter.post("/", createProject);
projectsRouter.patch("/:id", updateProject);
projectsRouter.get("/:id", readProject);
projectsRouter.delete("/:id", deleteProject);