import { z } from "zod";

/**
 * Public beacon body. Everything is derived from the request where possible
 * (IP → geo, user-agent → device), so the client only sends identity + route.
 * Fields are capped defensively because the endpoint is unauthenticated.
 */
export const trackVisitSchema = z.object({
  kind: z.enum(["view", "leave", "beat"]).default("view"),
  sessionId: z.string().trim().min(8).max(64),
  visitorId: z.string().trim().max(64).optional(),
  path: z.string().trim().min(1).max(200),
  referrer: z.string().trim().max(300).optional(),
  durationMs: z.coerce.number().int().min(0).max(3_600_000).optional(),
});

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
});

export type TrackVisitInput = z.infer<typeof trackVisitSchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
