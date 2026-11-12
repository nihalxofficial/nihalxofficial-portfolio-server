import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createTestimonial,
  deleteTestimonial,
  listTestimonials,
  readTestimonial,
  updateTestimonial,
} from "./testimonials.controller";

export const testimonialsRouter = Router();
testimonialsRouter.use(requireAdmin);

testimonialsRouter.get("/", listTestimonials);
testimonialsRouter.post("/", createTestimonial);
testimonialsRouter.patch("/:id", updateTestimonial);
testimonialsRouter.get("/:id", readTestimonial);
testimonialsRouter.delete("/:id", deleteTestimonial);