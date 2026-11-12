import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createNavigationItem,
  deleteNavigationItem,
  listNavigation,
  readNavigationItem,
  updateNavigationItem,
} from "./navigation.controller";

export const navigationRouter = Router();
navigationRouter.use(requireAdmin);

navigationRouter.get("/", listNavigation);
navigationRouter.post("/", createNavigationItem);
navigationRouter.patch("/:id", updateNavigationItem);
navigationRouter.get("/:id", readNavigationItem);
navigationRouter.delete("/:id", deleteNavigationItem);