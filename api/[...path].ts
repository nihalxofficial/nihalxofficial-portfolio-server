import type { Request, Response } from "express";
import { createApp } from "../src/app";
import { connectDatabase } from "../src/config/db";

/**
 * Vercel entry point.
 *
 * File-system routing sends every `/api/*` request here with the original URL
 * intact, so the Express app keeps serving its `/api/v1/...` routes unchanged.
 * `local` deployments keep using `src/index.ts` (a long-lived server).
 */
const app = createApp();

let databaseReady: Promise<void> | null = null;

/** One connection per warm lambda; a failed attempt is retried by the next request. */
function ensureDatabase(): Promise<void> {
  if (!databaseReady) {
    databaseReady = connectDatabase().catch((error) => {
      databaseReady = null;
      throw error;
    });
  }
  return databaseReady;
}

export default async function handler(req: Request, res: Response) {
  try {
    await ensureDatabase();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[api] database unavailable:", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: "Database unavailable", data: null }));
    return;
  }

  app(req, res);
}
