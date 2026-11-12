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
import { AboutModel } from "../modules/about/about.model";
import { HeroModel } from "../modules/hero/hero.model";
import { NavigationModel } from "../modules/navigation/navigation.model";
import { SectionModel } from "../modules/sections/sections.model";
import { SiteSettingsModel } from "../modules/settings/settings.model";

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

// Matches the design's current out-of-the-box look, so seeding changes nothing.
const DEFAULT_THEME = {
  accentId: "cyan",
  backgroundEffect: "dna",
  palette: { primary: "", secondary: "", background: "", text: "" },
};

const STATS_GOALS = [
  "Get a full-time remote job",
  "Master DSA & System Design",
  "Contribute to open source",
  "Build something meaningful",
];

/** Destinations worth a thumb-sized target in the mobile bottom dock. */
const DOCK_HREFS = ["#hero", "#projects", "#contact"];

/**
 * The navigation set the redesign publishes by default: the five anchors that
 * were previously hard-coded in `app/page.tsx`. Everything else ships hidden so
 * the Navigation Manager can re-enable it, keeping the out-of-the-box visuals
 * identical while moving control into the CMS.
 */
const NAV_PUBLISHED = ["#hero", "#about", "#skills", "#showcase", "#contact"];
const NAV_UNPUBLISHED = ["#projects", "#journey", "#education", "#blog"];

/** Headings the About block shipped with, before the redesign renamed it. */
const ABOUT_LEGACY_HEADINGS = ["", "A little about me"];

/**
 * Section headings the redesign expects, applied only while the document still
 * carries the previous default — an admin's own wording is never overwritten.
 */
const SECTION_HEADINGS: Array<{ key: string; heading: string; was: string[] }> = [
  { key: "about", heading: "Who Am I?", was: ABOUT_LEGACY_HEADINGS },
];

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

  // ── Settings: global theme defaults (never overwrite an owner's choice) ─────
  const theme = await SiteSettingsModel.updateMany(
    { $or: [{ theme: { $exists: false } }, { "theme.accentId": "" }, { "theme.accentId": { $exists: false } }] },
    { $set: { theme: DEFAULT_THEME } },
  );

  // ── Navigation: ensure the new-tab flag exists on older documents ──────────
  const navNewTab = await NavigationModel.updateMany(
    { opensInNewTab: { $exists: false } },
    { $set: { opensInNewTab: false } },
  );

  // ── Section extras: the goals list beside the stats ────────────────────────
  const items = await SectionModel.updateMany(
    { key: "stats", $or: [{ items: { $exists: false } }, { items: { $size: 0 } }] },
    { $set: { items: STATS_GOALS } },
  );

  // ── Section headings: rename the defaults the design replaced ──────────────
  let headings = 0;
  for (const entry of SECTION_HEADINGS) {
    const result = await SectionModel.updateMany(
      { key: entry.key, heading: { $in: entry.was } },
      { $set: { heading: entry.heading } },
    );
    headings += result.modifiedCount;
  }

  // The About document carries the same heading as a fallback for the section.
  const aboutDoc = await AboutModel.updateMany(
    { heading: { $in: ABOUT_LEGACY_HEADINGS } },
    { $set: { heading: "Who Am I?" } },
  );

  // ── Publish-ready defaults: align nav + section rows with the current design ─
  // The homepage now renders purely from `sections`/`navigation`, so existing
  // databases need the same published set the design shows out of the box. This
  // is a one-shot migration, gated on the `#showcase` nav item: it never exists
  // in a pre-CMS database, and once created an admin's later edits are respected.
  let navAligned = 0;
  let sectionsAdded = 0;
  const showcase = await NavigationModel.findOne({ href: "#showcase" });
  if (!showcase) {
    await NavigationModel.create({
      label: "Showcase",
      href: "#showcase",
      icon: "Rocket",
      order: 5,
      isPrimary: true,
      isVisible: true,
    });

    const visible = await NavigationModel.updateMany(
      { href: { $in: NAV_PUBLISHED } },
      { $set: { isVisible: true } },
    );
    const hidden = await NavigationModel.updateMany(
      { href: { $in: NAV_UNPUBLISHED } },
      { $set: { isVisible: false } },
    );
    navAligned = 1 + visible.modifiedCount + hidden.modifiedCount;

    // Section rows the homepage renders that the original seed never carried.
    const upsertSection = (row: { key: string; label: string; heading: string; order: number; isVisible: boolean }) =>
      SectionModel.updateOne(
        { key: row.key },
        { $setOnInsert: row },
        { upsert: true },
      );
    await upsertSection({ key: "services", label: "Services", heading: "What I Do", order: 4, isVisible: true });
    await upsertSection({ key: "testimonials", label: "Testimonials", heading: "What People Say", order: 11, isVisible: false });
    sectionsAdded = 2;
  }

  // eslint-disable-next-line no-console
  console.log("[backfill:design] documents updated:", {
    navigationIcons: icons,
    dockPrimary: dock,
    heroTagline: tagline.modifiedCount,
    wordmark: wordmark.modifiedCount,
    typography: fonts.modifiedCount,
    mapZoom: zoom.modifiedCount,
    theme: theme.modifiedCount,
    navNewTab: navNewTab.modifiedCount,
    statsItems: items.modifiedCount,
    sectionHeadings: headings,
    aboutHeading: aboutDoc.modifiedCount,
    navAligned,
    sectionsAdded,
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
