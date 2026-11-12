import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createCertification,
  deleteCertification,
  listCertifications,
  readCertification,
  updateCertification,
} from "./certifications.controller";

export const certificationsRouter = Router();
certificationsRouter.use(requireAdmin);

certificationsRouter.get("/", listCertifications);
certificationsRouter.post("/", createCertification);
certificationsRouter.patch("/:id", updateCertification);
certificationsRouter.get("/:id", readCertification);
certificationsRouter.delete("/:id", deleteCertification);