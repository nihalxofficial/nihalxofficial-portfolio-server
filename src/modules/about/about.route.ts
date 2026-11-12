import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createAbout,
  deleteAbout,
  listAbout,
  readAbout,
  updateAbout,
} from "./about.controller";

export const aboutRouter = Router();
aboutRouter.use(requireAuth, requireRole("admin"));

aboutRouter.get("/", listAbout);
aboutRouter.post("/", createAbout);
aboutRouter.patch("/:id", updateAbout);
aboutRouter.get("/:id", readAbout);
aboutRouter.delete("/:id", deleteAbout);