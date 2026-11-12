/**
 * One-off, idempotent content corrections for the live database.
 *
 * Re-running `seed` would wipe everything edited from the dashboard, so this
 * script only touches the three entries the owner asked to change and leaves
 * every other document alone.
 *
 *   1. Numbers Speak keeps three cards — projects, hours of learning, learning.
 *   2. The journey drops the Itransition training block (it never happened) and
 *      gains the mentoring term at the FPI Computer Club instead.
 *   3. Certifications are folded away; the education column lists degrees only.
 *
 * Run with: npm run backfill:content
 */
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db";
import {
  ExperienceModel,
  NavigationModel,
  SectionModel,
  StatisticModel,
} from "../modules/admin/models";

/** Cards the owner does not want on the Numbers Speak shelf. */
const DROPPED_STATS = ["Technologies Mastered", "Internship"];

/** The trainings that were never actually attended. */
const DROPPED_ORGANIZATIONS = [/itransition/i];

const MENTORSHIP = {
  organization: "Feni Polytechnic Institute",
  role: "Mentor · FPI Computer Club",
  employmentType: "Mentorship",
  location: "Feni, Bangladesh",
  startDate: "Jan 2026",
  endDate: "Jun 2026",
  isCurrent: false,
  status: "completed",
  description:
    "Mentored fellow students through their first web projects, reviewing code and running hands-on sessions for the club.",
  technologies: ["HTML", "CSS", "JavaScript", "Git"],
  isVisible: true,
};

async function backfill() {
  await connectDatabase();

  // ── Numbers Speak: keep three cards ────────────────────────────────────────
  const stats = await StatisticModel.deleteMany({ label: { $in: DROPPED_STATS } });

  // ── Journey: drop the trainings, keep the mentoring ────────────────────────
  const dropped = await ExperienceModel.deleteMany({
    organization: { $in: DROPPED_ORGANIZATIONS },
  });

  const existing = await ExperienceModel.findOne({
    organization: /feni polytechnic/i,
    role: /mentor/i,
  });
  const added = existing ? 0 : 1;
  if (!existing) {
    // Sit right after the current role so the timeline reads newest first.
    const bdsoft = await ExperienceModel.findOne({ organization: /bdsoft/i });
    await ExperienceModel.create({ ...MENTORSHIP, order: (bdsoft?.order ?? 0) + 1 });
  }

  // ── Certifications: hide the section and its nav entry ─────────────────────
  const section = await SectionModel.updateOne(
    { key: "certifications" },
    { $set: { isVisible: false } },
  );
  const nav = await NavigationModel.updateMany(
    { href: "#certifications" },
    { $set: { isVisible: false } },
  );

  // eslint-disable-next-line no-console
  console.log("[backfill:content] documents updated:", {
    statsRemoved: stats.deletedCount,
    trainingsRemoved: dropped.deletedCount,
    mentorshipAdded: added,
    certificationsSectionHidden: section.modifiedCount,
    certificationsNavHidden: nav.modifiedCount,
  });

  await disconnectDatabase();
  await mongoose.connection.close();
}

backfill().catch(async (error) => {
  // eslint-disable-next-line no-console
  console.error("[backfill:content] failed:", error);
  await mongoose.connection.close().catch(() => undefined);
  process.exit(1);
});
