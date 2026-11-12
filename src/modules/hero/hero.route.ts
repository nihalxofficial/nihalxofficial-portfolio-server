import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createHero,
  deleteHero,
  listHero,
  readHero,
  updateHero,
} from "./hero.controller";

export const heroRouter = Router();
heroRouter.use(requireAdmin);

heroRouter.get("/", listHero);
heroRouter.post("/", createHero);
heroRouter.patch("/:id", updateHero);
heroRouter.get("/:id", readHero);
heroRouter.delete("/:id", deleteHero);