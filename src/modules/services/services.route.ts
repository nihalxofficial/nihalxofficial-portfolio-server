import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createService,
  deleteService,
  listServices,
  readService,
  updateService,
} from "./services.controller";

export const servicesRouter = Router();
servicesRouter.use(requireAuth, requireRole("admin"));

servicesRouter.get("/", listServices);
servicesRouter.post("/", createService);
servicesRouter.patch("/:id", updateService);
servicesRouter.get("/:id", readService);
servicesRouter.delete("/:id", deleteService);