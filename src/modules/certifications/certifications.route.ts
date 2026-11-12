import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createCertification,
  deleteCertification,
  listCertifications,
  readCertification,
  updateCertification,
} from "./certifications.controller";

export const certificationsRouter = Router();
certificationsRouter.use(requireAuth, requireRole("admin"));

certificationsRouter.get("/", listCertifications);
certificationsRouter.post("/", createCertification);
certificationsRouter.patch("/:id", updateCertification);
certificationsRouter.get("/:id", readCertification);
certificationsRouter.delete("/:id", deleteCertification);