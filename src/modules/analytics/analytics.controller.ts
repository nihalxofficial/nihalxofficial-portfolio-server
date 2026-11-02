import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { getOverview, getRealtime, recordVisit } from "./analytics.service";
import type { AnalyticsQuery, TrackVisitInput } from "./analytics.validator";

/**
 * Fire-and-forget beacon. Always answers 204 so the browser's keepalive request
 * succeeds quietly; a bot or a dropped event is simply not persisted.
 */
export const trackVisit = catchAsync(async (req: Request, res: Response) => {
  await recordVisit(req, req.body as TrackVisitInput);
  return res.status(204).end();
});

export const analyticsOverview = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as AnalyticsQuery;
  const days = query.days ?? 7;
  const data = await getOverview(days);

  return sendResponse(res, 200, { message: "Analytics overview", data });
});

export const analyticsRealtime = catchAsync(async (req: Request, res: Response) => {
  const data = await getRealtime();

  return sendResponse(res, 200, { message: "Live traffic", data });
});
