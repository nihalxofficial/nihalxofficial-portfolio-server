import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createStatistic,
  deleteStatistic,
  listStatistics,
  readStatistic,
  updateStatistic,
} from "./statistics.controller";

export const statisticsRouter = Router();
statisticsRouter.use(requireAdmin);

statisticsRouter.get("/", listStatistics);
statisticsRouter.post("/", createStatistic);
statisticsRouter.patch("/:id", updateStatistic);
statisticsRouter.get("/:id", readStatistic);
statisticsRouter.delete("/:id", deleteStatistic);