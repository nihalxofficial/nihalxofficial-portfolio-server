import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createEducation,
  deleteEducation,
  listEducation,
  readEducation,
  updateEducation,
} from "./education.controller";

export const educationRouter = Router();
educationRouter.use(requireAdmin);

educationRouter.get("/", listEducation);
educationRouter.post("/", createEducation);
educationRouter.patch("/:id", updateEducation);
educationRouter.get("/:id", readEducation);
educationRouter.delete("/:id", deleteEducation);