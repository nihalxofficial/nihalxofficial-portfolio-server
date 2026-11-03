import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import { analyticsLimiter } from "../../middlewares/rateLimit";
import { validate } from "../../middlewares/validate";
import {
  analyticsOverview,
  analyticsProjects,
  analyticsRealtime,
  trackVisit,
} from "./analytics.controller";
import { analyticsQuerySchema, trackVisitSchema } from "./analytics.validator";

// Public — mounted under /api/v1/analytics. The visitor beacon.
export const analyticsPublicRouter = Router();
analyticsPublicRouter.post("/", analyticsLimiter, validate({ body: trackVisitSchema }), trackVisit);

// Admin — mounted under /api/v1/admin/analytics.
export const analyticsAdminRouter = Router();
analyticsAdminRouter.use(requireAdmin);
analyticsAdminRouter.get("/overview", validate({ query: analyticsQuerySchema }), analyticsOverview);
analyticsAdminRouter.get("/realtime", analyticsRealtime);
analyticsAdminRouter.get("/projects", validate({ query: analyticsQuerySchema }), analyticsProjects);
