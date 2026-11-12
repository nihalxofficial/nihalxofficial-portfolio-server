import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { notFound } from "./middlewares/notFound.middleware";
import { aiRouter, aiAdminRouter } from "./modules/ai/ai.route";
import { analyticsAdminRouter, analyticsPublicRouter } from "./modules/analytics/analytics.route";
import { authRouter } from "./modules/auth/auth.route";
import { certificationsRouter } from "./modules/certifications/certifications.route";
import { contactRouter } from "./modules/contact/contact.route";
import { educationRouter } from "./modules/education/education.route";
import { experienceRouter } from "./modules/experience/experience.route";
import { heroRouter } from "./modules/hero/hero.route";
import { aboutRouter } from "./modules/about/about.route";
import { mediaRouter } from "./modules/media/media.route";
import { navigationRouter } from "./modules/navigation/navigation.route";
import { portfolioRouter } from "./modules/portfolio/portfolio.route";
import { postsRouter } from "./modules/posts/posts.route";
import { projectsRouter } from "./modules/projects/projects.route";
import { sectionsRouter } from "./modules/sections/sections.route";
import { servicesRouter } from "./modules/services/services.route";
import { settingsRouter } from "./modules/settings/settings.route";
import { skillsRouter } from "./modules/skills/skills.route";
import { statisticsRouter } from "./modules/statistics/statistics.route";
import { testimonialsRouter } from "./modules/testimonials/testimonials.route";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(compression());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());

  // Media uploads carry base64 images, so this router brings its own larger
  // json limit and must be mounted before the small global parser below.
  app.use("/api/v1/admin/media", mediaRouter);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      environment: env.NODE_ENV,
      assistant: env.GEMINI_API_KEY ? "configured" : "missing",
      email: env.smtpConfigured ? "configured" : "missing",
      media: env.IMGBB_API_KEY ? "configured" : "missing",
      timestamp: new Date().toISOString(),
    });
  });

  const api = express.Router();

  api.use("/portfolio", portfolioRouter);
  api.use("/contact", contactRouter);
  api.use("/analytics", analyticsPublicRouter);
  api.use("/ai", aiRouter);
  api.use("/auth", authRouter);

  api.use("/admin/messages", contactRouter);
  api.use("/admin/ai", aiAdminRouter);
  api.use("/admin/analytics", analyticsAdminRouter);

  // Feature-based admin routers (Sparq-Server layered architecture)
  api.use("/admin/projects", projectsRouter);
  api.use("/admin/posts", postsRouter);
  api.use("/admin/hero", heroRouter);
  api.use("/admin/about", aboutRouter);
  api.use("/admin/statistics", statisticsRouter);
  api.use("/admin/services", servicesRouter);
  api.use("/admin/testimonials", testimonialsRouter);
  api.use("/admin/navigation", navigationRouter);
  api.use("/admin/sections", sectionsRouter);
  api.use("/admin/settings", settingsRouter);
  api.use("/admin/certifications", certificationsRouter);
  api.use("/admin/education", educationRouter);
  api.use("/admin/experience", experienceRouter);
  api.use("/admin/skills", skillsRouter);
  api.use("/admin/media", mediaRouter);

  app.use("/api/v1", api);

  app.use(notFound);
  app.use(errorMiddleware);

  return app;
}