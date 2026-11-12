import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createAbout,
  deleteAbout,
  listAbout,
  readAbout,
  updateAbout,
} from "./about.controller";

export const aboutRouter = Router();
aboutRouter.use(requireAdmin);

aboutRouter.get("/", listAbout);
aboutRouter.post("/", createAbout);
aboutRouter.patch("/:id", updateAbout);
aboutRouter.get("/:id", readAbout);
aboutRouter.delete("/:id", deleteAbout);