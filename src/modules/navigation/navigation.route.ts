import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createNavigationItem,
  deleteNavigationItem,
  listNavigation,
  readNavigationItem,
  updateNavigationItem,
} from "./navigation.controller";

export const navigationRouter = Router();
navigationRouter.use(requireAuth, requireRole("admin"));

navigationRouter.get("/", listNavigation);
navigationRouter.post("/", createNavigationItem);
navigationRouter.patch("/:id", updateNavigationItem);
navigationRouter.get("/:id", readNavigationItem);
navigationRouter.delete("/:id", deleteNavigationItem);