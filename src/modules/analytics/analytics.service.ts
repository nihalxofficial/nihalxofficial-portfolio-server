import type { Request } from "express";
import { VisitModel } from "../../models";
import { resolveGeo } from "../../utils/geo";
import { parseUserAgent } from "../../utils/userAgent";
import type { TrackVisitInput } from "./analytics.validator";

/** Sessions with an event in the last 5 minutes count as "online now". */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/** Referrer host, or a friendly label for direct / internal traffic. */
function deriveSource(referrer?: string): string {
  if (!referrer) return "Direct";
  if (referrer.startsWith("/")) return "Internal";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "") || "Direct";
  } catch {
    return "Direct";
  }
}

/**
 * Appends one analytics event. Obvious crawlers are dropped so the numbers mean
 * people. Geo and device come from request headers, never from the body, and no
 * raw IP is ever stored — this keeps the endpoint safe to expose publicly.
 */
export async function recordVisit(req: Request, input: TrackVisitInput) {
  const agent = parseUserAgent(req.headers["user-agent"] ?? "");
  if (agent.isBot) return { recorded: false };

  const geo = resolveGeo(req);

  // Beats and leaves don't need the marketing fields re-derived every time.
  await VisitModel.create({
    kind: input.kind,
    sessionId: input.sessionId,
    visitorId: input.visitorId ?? "",
    path: input.path,
    referrer: input.referrer ?? "",
    source: deriveSource(input.referrer),
    durationMs: input.durationMs ?? 0,
    browser: agent.browser,
    browserVersion: agent.browserVersion,
    os: agent.os,
    device: agent.device,
    country: geo.country,
    countryCode: geo.countryCode,
    region: geo.region,
    city: geo.city,
    lat: geo.lat,
    lng: geo.lng,
    isBot: false,
  });

  return { recorded: true };
}

export interface AnalyticsOverview {
  range: { days: number; from: string };
  totals: {
    pageViews: number;
    sessions: number;
    uniqueVisitors: number;
    onlineNow: number;
    avgDurationMs: number;
    bounceRate: number;
  };
  timeline: Array<{ bucket: string; pageViews: number; sessions: number }>;
  topPages: Array<{ path: string; views: number }>;
  sources: Array<{ source: string; views: number }>;
  browsers: Array<{ name: string; count: number }>;
  oses: Array<{ name: string; count: number }>;
  devices: Array<{ name: string; count: number }>;
  countries: Array<{ country: string; code: string; lat?: number; lng?: number; count: number }>;
  recent: Array<{
    path: string;
    city: string;
    country: string;
    browser: string;
    device: string;
    at: string;
  }>;
}

function groupByField(match: Record<string, unknown>, field: string, limit = 8) {
  return VisitModel.aggregate([
    { $match: match },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, name: "$_id", count: 1 } },
  ]);
}

export async function getOverview(days: number): Promise<AnalyticsOverview> {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const base = { isBot: false, createdAt: { $gte: from } };
  const viewsOnly = { ...base, kind: "view" };

  const [pvRow, sessionRows, durationRows, onlineRows, timeline, topPages, sources, browsers, oses, devices, countries] =
    await Promise.all([
      // Page views + unique visitors.
      VisitModel.aggregate([
        { $match: viewsOnly },
        {
          $group: {
            _id: null,
            pageViews: { $sum: 1 },
            visitors: { $addToSet: { $ifNull: ["$visitorId", "$sessionId"] } },
          },
        },
      ]),
      // Sessions + bounces: one row per session with its view count.
      VisitModel.aggregate([
        { $match: base },
        {
          $group: {
            _id: "$sessionId",
            views: { $sum: { $cond: [{ $eq: ["$kind", "view"] }, 1, 0] } },
          },
        },
      ]),
      // Total time per session, summed from the `leave` events.
      VisitModel.aggregate([
        { $match: { ...base, kind: "leave" } },
        { $group: { _id: "$sessionId", total: { $sum: "$durationMs" } } },
      ]),
      // Online now (independent of the selected range).
      VisitModel.aggregate([
        { $match: { isBot: false, createdAt: { $gte: new Date(Date.now() - ONLINE_WINDOW_MS) } } },
        { $group: { _id: "$sessionId" } },
      ]),
      // Timeline: hourly for short ranges, otherwise daily.
      VisitModel.aggregate([
        { $match: base },
        {
          $group: {
            _id: {
              $dateToString: {
                format: days <= 2 ? "%Y-%m-%dT%H:00" : "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            pageViews: { $sum: { $cond: [{ $eq: ["$kind", "view"] }, 1, 0] } },
            sessions: { $addToSet: "$sessionId" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, bucket: "$_id", pageViews: 1, sessions: { $size: "$sessions" } } },
      ]),
      VisitModel.aggregate([
        { $match: viewsOnly },
        { $group: { _id: "$path", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, path: "$_id", views: 1 } },
      ]),
      VisitModel.aggregate([
        { $match: viewsOnly },
        { $group: { _id: "$source", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, source: "$_id", views: 1 } },
      ]),
      groupByField(viewsOnly, "browser"),
      groupByField(viewsOnly, "os"),
      groupByField(viewsOnly, "device"),
      VisitModel.aggregate([
        { $match: { ...viewsOnly, countryCode: { $ne: "" } } },
        {
          $group: {
            _id: "$countryCode",
            country: { $first: "$country" },
            lat: { $first: "$lat" },
            lng: { $first: "$lng" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 60 },
        { $project: { _id: 0, country: 1, code: "$_id", lat: 1, lng: 1, count: 1 } },
      ]),
    ]);

  // Recent activity feed (last 20 page views).
  const recentDocs = await VisitModel.find(viewsOnly)
    .sort({ createdAt: -1 })
    .limit(20)
    .select("path city country browser device createdAt")
    .lean();

  const sessions = sessionRows.length;
  const bounces = sessionRows.filter((row) => row.views <= 1).length;
  const totalDuration = durationRows.reduce((sum, row) => sum + row.total, 0);
  const durationSessions = durationRows.length || 1;

  return {
    range: { days, from: from.toISOString() },
    totals: {
      pageViews: pvRow[0]?.pageViews ?? 0,
      sessions,
      uniqueVisitors: pvRow[0]?.visitors?.length ?? 0,
      onlineNow: onlineRows.length,
      avgDurationMs: Math.round(totalDuration / durationSessions),
      bounceRate: sessions ? Math.round((bounces / sessions) * 100) : 0,
    },
    timeline,
    topPages,
    sources,
    browsers,
    oses,
    devices,
    countries,
    recent: recentDocs.map((doc) => ({
      path: doc.path,
      city: doc.city,
      country: doc.country,
      browser: doc.browser,
      device: doc.device,
      at: (doc.createdAt ?? new Date()).toISOString(),
    })),
  };
}

export interface AnalyticsRealtime {
  onlineNow: number;
  pages: Array<{ path: string; count: number }>;
  countries: Array<{ country: string; code: string; lat?: number; lng?: number; count: number }>;
  events: Array<{
    path: string;
    city: string;
    country: string;
    browser: string;
    device: string;
    at: string;
  }>;
}

/** Cheap, polled every ~15s: who is on the site in the last five minutes. */
export async function getRealtime(): Promise<AnalyticsRealtime> {
  const since = new Date(Date.now() - ONLINE_WINDOW_MS);
  const match = { isBot: false, createdAt: { $gte: since } };

  const [sessions, pages, countries, eventDocs] = await Promise.all([
    VisitModel.aggregate([{ $match: match }, { $group: { _id: "$sessionId" } }]),
    VisitModel.aggregate([
      { $match: { ...match, kind: "view" } },
      { $group: { _id: "$path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
      { $project: { _id: 0, path: "$_id", count: 1 } },
    ]),
    VisitModel.aggregate([
      { $match: { ...match, countryCode: { $ne: "" } } },
      {
        $group: {
          _id: "$countryCode",
          country: { $first: "$country" },
          lat: { $first: "$lat" },
          lng: { $first: "$lng" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 40 },
      { $project: { _id: 0, country: 1, code: "$_id", lat: 1, lng: 1, count: 1 } },
    ]),
    VisitModel.find(match)
      .sort({ createdAt: -1 })
      .limit(30)
      .select("path city country browser device createdAt")
      .lean(),
  ]);

  return {
    onlineNow: sessions.length,
    pages,
    countries,
    events: eventDocs.map((doc) => ({
      path: doc.path,
      city: doc.city,
      country: doc.country,
      browser: doc.browser,
      device: doc.device,
      at: (doc.createdAt ?? new Date()).toISOString(),
    })),
  };
}
