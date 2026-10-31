/**
 * One-off, idempotent backfill for the design fields added to the schema.
 *
 * `npm run seed --reset` would wipe the content edited from the dashboard, so
 * this script only fills fields that are still empty and never overwrites a
 * value an admin has set.
 *
 * Run with: npm run backfill:design
 */
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db";
import {
  HeroModel,
  NavigationModel,
  SectionModel,
  SiteSettingsModel,
} from "../models";

/** Same icon map the header pill falls back to, keyed by anchor target. */
const ICON_BY_TARGET: Record<string, string> = {
  hero: "Home",
  about: "User",
  stats: "BarChart3",
  skills: "Wrench",
  services: "Layers",
  projects: "FolderKanban",
  showcase: "Rocket",
  journey: "Briefcase",
  education: "GraduationCap",
  certifications: "Award",
  testimonials: "Quote",
  blog: "Newspaper",
  contact: "Mail",
};

const DEFAULT_TYPOGRAPHY = {
  sans: "outfit",
  display: "space-grotesk",
  mono: "jetbrains-mono",
};

const STATS_GOALS = [
  "Get a full-time remote job",
  "Master DSA & System Design",
  "Contribute to open source",
  "Build something meaningful",
];

/** Destinations worth a thumb-sized target in the mobile bottom dock. */
const DOCK_HREFS = ["#hero", "#projects", "#contact"];

function targetOf(href: string): string {
  const raw = String(href ?? "").replace(/^#/, "").split("/")[0];
  return raw || "hero";
}

async function backfill() {
  await connectDatabase();

  // ── Navigation icons ───────────────────────────────────────────────────────
  const pendingNav = await NavigationModel.find({
    $or: [{ icon: { $exists: false } }, { icon: "" }],
  });

  let icons = 0;
  for (const item of pendingNav) {
    const icon = ICON_BY_TARGET[targetOf(item.href)];
    if (!icon) continue;
    item.icon = icon;
    await item.save();
    icons += 1;
  }

  // ── Mobile dock: flag the primary destinations only if nothing is flagged ──
  const flagged = await NavigationModel.countDocuments({ isPrimary: true });
  const dock =
    flagged > 0
      ? 0
      : (
          await NavigationModel.updateMany(
            { href: { $in: DOCK_HREFS } },
            { $set: { isPrimary: true } },
          )
        ).modifiedCount;

  // ── Hero tagline (handwritten note beside the portrait) ────────────────────
  const tagline = await HeroModel.updateMany(
    { $or: [{ tagline: { $exists: false } }, { tagline: "" }] },
    { $set: { tagline: "Better Code, Better Tomorrow" } },
  );

  // ── Settings: wordmark, fonts, map zoom ────────────────────────────────────
  const wordmark = await SiteSettingsModel.updateMany(
    { $or: [{ "branding.wordmark": { $exists: false } }, { "branding.wordmark": "" }] },
    { $set: { "branding.wordmark": "nihalxofficial" } },
  );

  const fonts = await SiteSettingsModel.updateMany(
    { $or: [{ typography: { $exists: false } }, { "typography.sans": "" }, { "typography.sans": { $exists: false } }] },
    { $set: { typography: DEFAULT_TYPOGRAPHY } },
  );

  const zoom = await SiteSettingsModel.updateMany(
    { "contact.mapZoom": { $exists: false } },
    { $set: { "contact.mapZoom": 12 } },
  );

  // ── Section extras: the goals list beside the stats ────────────────────────
  const items = await SectionModel.updateMany(
    { key: "stats", $or: [{ items: { $exists: false } }, { items: { $size: 0 } }] },
    { $set: { items: STATS_GOALS } },
  );

  // eslint-disable-next-line no-console
  console.log("[backfill:design] documents updated:", {
    navigationIcons: icons,
    dockPrimary: dock,
    heroTagline: tagline.modifiedCount,
    wordmark: wordmark.modifiedCount,
    typography: fonts.modifiedCount,
    mapZoom: zoom.modifiedCount,
    statsItems: items.modifiedCount,
  });

  await disconnectDatabase();
  await mongoose.connection.close();
}

backfill().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("[backfill:design] failed:", error);
  await mongoose.connection.close().catch(() => undefined);
  process.exit(1);
});
