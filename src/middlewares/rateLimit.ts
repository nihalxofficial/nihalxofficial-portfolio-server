import rateLimit from "express-rate-limit";
import { env } from "../config/env";

const skipInDev = () => !env.isProduction;

/** Guards the public form endpoints against spam and bursts. */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: skipInDev,
  message: { success: false, message: "Too many messages sent. Please try again later." },
});

/** The AI assistant costs money per token, so it is limited separately. */
export const chatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: skipInDev,
  message: { success: false, message: "You are chatting too fast. Give it a minute." },
});

/** Admin writing assistant: generous, but still capped to protect the quota. */
export const assistLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 40,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: skipInDev,
  message: { success: false, message: "Slow down a little before generating again." },
});

export const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: skipInDev,
});
