import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createStatistic,
  deleteStatistic,
  listStatistics,
  readStatistic,
  updateStatistic,
} from "./statistics.controller";

export const statisticsRouter = Router();
statisticsRouter.use(requireAuth, requireRole("admin"));

statisticsRouter.get("/", listStatistics);
statisticsRouter.post("/", createStatistic);
statisticsRouter.patch("/:id", updateStatistic);
statisticsRouter.get("/:id", readStatistic);
statisticsRouter.delete("/:id", deleteStatistic);