import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createEducation,
  deleteEducation,
  listEducation,
  readEducation,
  updateEducation,
} from "./education.controller";

export const educationRouter = Router();
educationRouter.use(requireAuth, requireRole("admin"));

educationRouter.get("/", listEducation);
educationRouter.post("/", createEducation);
educationRouter.patch("/:id", updateEducation);
educationRouter.get("/:id", readEducation);
educationRouter.delete("/:id", deleteEducation);