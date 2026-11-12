import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createTestimonial,
  deleteTestimonial,
  listTestimonials,
  readTestimonial,
  updateTestimonial,
} from "./testimonials.controller";

export const testimonialsRouter = Router();
testimonialsRouter.use(requireAuth, requireRole("admin"));

testimonialsRouter.get("/", listTestimonials);
testimonialsRouter.post("/", createTestimonial);
testimonialsRouter.patch("/:id", updateTestimonial);
testimonialsRouter.get("/:id", readTestimonial);
testimonialsRouter.delete("/:id", deleteTestimonial);