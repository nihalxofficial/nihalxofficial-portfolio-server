import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { isFirebaseConfigured } from "./config/firebase";
import { errorHandler, notFoundHandler } from "./middlewares/error";
import { aiRouter, aiAdminRouter } from "./modules/ai/ai.route";
import { authRouter } from "./modules/auth/auth.route";
import { contactAdminRouter, contactPublicRouter } from "./modules/contact/contact.route";
import { portfolioRouter } from "./modules/portfolio/portfolio.route";
import { mediaAdminRouter } from "./modules/media/media.route";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(compression());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin/server-to-server calls (no Origin header) and
        // every explicitly configured frontend origin.
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
  app.use("/api/v1/admin/media", mediaAdminRouter);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      environment: env.NODE_ENV,
      firebase: isFirebaseConfigured() ? "configured" : "missing",
      assistant: env.GEMINI_API_KEY ? "configured" : "missing",
      email: env.smtpConfigured ? "configured" : "missing",
      media: env.IMGBB_API_KEY ? "configured" : "missing",
      timestamp: new Date().toISOString(),
    });
  });

  const api = express.Router();

  api.use("/portfolio", portfolioRouter);
  api.use("/contact", contactPublicRouter);
  api.use("/ai", aiRouter);
  api.use("/auth", authRouter);

  api.use("/admin/messages", contactAdminRouter);
  api.use("/admin/ai", aiAdminRouter);

  app.use("/api/v1", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
