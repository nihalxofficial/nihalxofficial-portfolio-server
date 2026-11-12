import type { Request } from "express";
import { ProjectModel } from "../projects/models";
import { VisitModel } from "./models";
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

  // Never record admin activities, dashboard control-centre navigations, or requests with admin tokens
  if (
    input.isAdmin ||
    input.path.startsWith("/control-centre") ||
    input.path.startsWith("/admin") ||
    Boolean(req.headers.authorization)
  ) {
    return { recorded: false };
  }

  const geo = resolveGeo(req);

  const resolvedProjectId =
    input.projectId ||
    (input.path.startsWith("/projects/") ? input.path.replace("/projects/", "").split("/")[0] : "");

  const resolvedEventType =
    input.eventType ||
    (input.kind === "click" ? "project_click" : input.path.startsWith("/projects/") ? "project_view" : "page_view");

  await VisitModel.create({
    kind: input.kind,
    sessionId: input.sessionId,
    visitorId: input.visitorId ?? "",
    path: input.path,
    projectId: resolvedProjectId,
    eventType: resolvedEventType,
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
  newVsReturning: { newVisitors: number; returningVisitors: number };
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
  // Purge any legacy admin/control-centre activity rows in the background
  void VisitModel.deleteMany({ path: { $regex: "^/(control-centre|admin)", $options: "i" } }).catch(() => {});

  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const base = {
    isBot: false,
    createdAt: { $gte: from },
    path: { $not: /^\/(control-centre|admin)/i },
  };
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

  // New vs returning: a visitor is "new" when their earliest stored visit falls
  // inside the range; otherwise they had been here before it started.
  const visitorsInRange = (await VisitModel.distinct("visitorId", {
    ...viewsOnly,
    visitorId: { $ne: "" },
  }))
    .map((id) => String(id))
    .filter(Boolean);
  const returningIds = visitorsInRange.length
    ? (
        await VisitModel.distinct("visitorId", {
          isBot: false,
          visitorId: { $in: visitorsInRange },
          createdAt: { $lt: from },
        })
      ).map((id) => String(id))
    : [];
  const returningVisitors = new Set(returningIds).size;
  const newVsReturning = {
    newVisitors: Math.max(0, visitorsInRange.length - returningVisitors),
    returningVisitors,
  };

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
    newVsReturning,
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
  const match = {
    isBot: false,
    createdAt: { $gte: since },
    path: { $not: /^\/(control-centre|admin)/i },
  };

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

// ─── Dedicated Project Engagement Analytics ──────────────────────────────────

export interface ProjectPerformanceMetric {
  slug: string;
  title: string;
  thumbnailUrl: string;
  category: string;
  views: number;
  uniqueVisitors: number;
  clicks: number;
  totalDurationMs: number;
  avgDurationSec: number;
  ctr: number;
}

export interface ProjectAnalyticsOverview {
  range: { days: number; from: string };
  totals: {
    totalProjectViews: number;
    totalProjectClicks: number;
    totalUniqueVisitors: number;
    avgEngagementDurationSec: number;
  };
  mostViewedProject: ProjectPerformanceMetric | null;
  mostEngagedProject: ProjectPerformanceMetric | null;
  projects: ProjectPerformanceMetric[];
  viewsComparison: Array<{ title: string; slug: string; views: number; clicks: number }>;
  timeline: Array<Record<string, string | number>>;
}

export async function getProjectAnalytics(days: number): Promise<ProjectAnalyticsOverview> {
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const baseMatch = {
    isBot: false,
    createdAt: { $gte: from },
    path: { $not: /^\/(control-centre|admin)/i },
  };

  const [allProjects, homeViews, viewRows, clickRows, leaveRows, timelineRows] = await Promise.all([
    ProjectModel.find({}).sort({ order: 1, createdAt: -1 }).select("title slug thumbnailUrl category isFeatured order").lean(),
    VisitModel.countDocuments({ ...baseMatch, kind: "view", path: "/" }),
    // Group views by project
    VisitModel.aggregate([
      {
        $match: {
          ...baseMatch,
          kind: "view",
          $or: [
            { projectId: { $ne: "" } },
            { path: { $regex: "^/projects/" } },
          ],
        },
      },
      {
        $addFields: {
          resolvedSlug: {
            $cond: [
              { $gt: [{ $strLenCP: { $ifNull: ["$projectId", ""] } }, 0] },
              "$projectId",
              { $ifNull: [{ $arrayElemAt: [{ $split: ["$path", "/"] }, 2] }, ""] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$resolvedSlug",
          views: { $sum: 1 },
          visitors: { $addToSet: { $ifNull: ["$visitorId", "$sessionId"] } },
        },
      },
    ]),
    // Group clicks by project
    VisitModel.aggregate([
      {
        $match: {
          ...baseMatch,
          kind: "click",
        },
      },
      {
        $group: {
          _id: "$projectId",
          clicks: { $sum: 1 },
        },
      },
    ]),
    // Group dwell durations by project
    VisitModel.aggregate([
      {
        $match: {
          ...baseMatch,
          kind: "leave",
          $or: [
            { projectId: { $ne: "" } },
            { path: { $regex: "^/projects/" } },
          ],
        },
      },
      {
        $addFields: {
          resolvedSlug: {
            $cond: [
              { $gt: [{ $strLenCP: { $ifNull: ["$projectId", ""] } }, 0] },
              "$projectId",
              { $ifNull: [{ $arrayElemAt: [{ $split: ["$path", "/"] }, 2] }, ""] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$resolvedSlug",
          totalDurationMs: { $sum: "$durationMs" },
        },
      },
    ]),
    // Group daily timeline per project
    VisitModel.aggregate([
      {
        $match: {
          ...baseMatch,
          kind: "view",
          $or: [
            { projectId: { $ne: "" } },
            { path: { $regex: "^/projects/" } },
          ],
        },
      },
      {
        $addFields: {
          resolvedSlug: {
            $cond: [
              { $gt: [{ $strLenCP: { $ifNull: ["$projectId", ""] } }, 0] },
              "$projectId",
              { $ifNull: [{ $arrayElemAt: [{ $split: ["$path", "/"] }, 2] }, ""] },
            ],
          },
          bucket: {
            $dateToString: {
              format: days <= 2 ? "%Y-%m-%dT%H:00" : "%Y-%m-%d",
              date: "$createdAt",
            },
          },
        },
      },
      {
        $group: {
          _id: { bucket: "$bucket", slug: "$resolvedSlug" },
          views: { $sum: 1 },
        },
      },
    ]),
  ]);

  const viewsMap = new Map<string, { views: number; uniqueVisitors: number }>();
  for (const r of viewRows) {
    if (r._id) {
      viewsMap.set(String(r._id).toLowerCase(), {
        views: r.views,
        uniqueVisitors: Array.isArray(r.visitors) ? r.visitors.length : 0,
      });
    }
  }

  const clicksMap = new Map<string, number>();
  for (const r of clickRows) {
    if (r._id) {
      clicksMap.set(String(r._id).toLowerCase(), r.clicks);
    }
  }

  const durationMap = new Map<string, number>();
  for (const r of leaveRows) {
    if (r._id) {
      durationMap.set(String(r._id).toLowerCase(), r.totalDurationMs);
    }
  }

  const baselineHomeViews = Math.max(homeViews, 1);

  const metrics: ProjectPerformanceMetric[] = allProjects.map((p) => {
    const slug = (p.slug || "").toLowerCase();
    const v = viewsMap.get(slug) ?? { views: 0, uniqueVisitors: 0 };
    const clicks = clicksMap.get(slug) ?? 0;
    const totalDurationMs = durationMap.get(slug) ?? 0;
    const avgDurationSec = v.views > 0 ? Math.round(totalDurationMs / (v.views * 1000)) : 0;
    const ctr = Number(((clicks / baselineHomeViews) * 100).toFixed(1));

    return {
      slug: p.slug,
      title: p.title,
      thumbnailUrl: p.thumbnailUrl || "",
      category: p.category || "Full-Stack",
      views: v.views,
      uniqueVisitors: v.uniqueVisitors,
      clicks,
      totalDurationMs,
      avgDurationSec,
      ctr,
    };
  });

  const totalProjectViews = metrics.reduce((acc, m) => acc + m.views, 0);
  const totalProjectClicks = metrics.reduce((acc, m) => acc + m.clicks, 0);
  const totalUniqueVisitors = metrics.reduce((acc, m) => acc + m.uniqueVisitors, 0);
  const totalDurationSum = metrics.reduce((acc, m) => acc + m.totalDurationMs, 0);
  const avgEngagementDurationSec =
    totalProjectViews > 0 ? Math.round(totalDurationSum / (totalProjectViews * 1000)) : 0;

  const sortedByViews = [...metrics].sort((a, b) => b.views - a.views);
  const sortedByEngagement = [...metrics].sort((a, b) => b.avgDurationSec - a.avgDurationSec);

  // Group timeline by bucket
  const timelineBucketsMap = new Map<string, Record<string, string | number>>();
  for (const row of timelineRows) {
    const bucket = row._id.bucket;
    const slug = row._id.slug;
    if (!timelineBucketsMap.has(bucket)) {
      timelineBucketsMap.set(bucket, { bucket });
    }
    const b = timelineBucketsMap.get(bucket)!;
    b[slug] = row.views;
  }
  const timeline = Array.from(timelineBucketsMap.values()).sort((a, b) =>
    String(a.bucket).localeCompare(String(b.bucket))
  );

  return {
    range: { days, from: from.toISOString() },
    totals: {
      totalProjectViews,
      totalProjectClicks,
      totalUniqueVisitors,
      avgEngagementDurationSec,
    },
    mostViewedProject: sortedByViews[0] && sortedByViews[0].views > 0 ? sortedByViews[0] : (metrics[0] ?? null),
    mostEngagedProject: sortedByEngagement[0] && sortedByEngagement[0].avgDurationSec > 0 ? sortedByEngagement[0] : (metrics[0] ?? null),
    projects: metrics,
    viewsComparison: metrics.map((m) => ({ title: m.title, slug: m.slug, views: m.views, clicks: m.clicks })),
    timeline,
  };
}
