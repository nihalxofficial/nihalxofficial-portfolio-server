import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createHero,
  deleteHero,
  listHero,
  readHero,
  updateHero,
} from "./hero.controller";

export const heroRouter = Router();
heroRouter.use(requireAuth, requireRole("admin"));

heroRouter.get("/", listHero);
heroRouter.post("/", createHero);
heroRouter.patch("/:id", updateHero);
heroRouter.get("/:id", readHero);
heroRouter.delete("/:id", deleteHero);