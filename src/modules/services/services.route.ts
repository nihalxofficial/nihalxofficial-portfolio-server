import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createService,
  deleteService,
  listServices,
  readService,
  updateService,
} from "./services.controller";

export const servicesRouter = Router();
servicesRouter.use(requireAdmin);

servicesRouter.get("/", listServices);
servicesRouter.post("/", createService);
servicesRouter.patch("/:id", updateService);
servicesRouter.get("/:id", readService);
servicesRouter.delete("/:id", deleteService);