import { Schema, model, type InferSchemaType } from "mongoose";

// ─── Skills ───────────────────────────────────────────────────────────────────
// Grouped by category in the UI; no percentage levels (they carry no meaning).
const skillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    icon: { type: String, default: "" },
    brandColor: { type: String, default: "" },
    proficiency: {
      type: String,
      enum: ["learning", "familiar", "advanced", "expert"],
      default: "advanced",
    },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);
skillSchema.index({ category: 1, order: 1 });

export type Skill = InferSchemaType<typeof skillSchema>;
export const SkillModel = model("Skill", skillSchema);

// ─── Experience ───────────────────────────────────────────────────────────────
const experienceSchema = new Schema(
  {
    organization: { type: String, required: true },
    role: { type: String, required: true },
    employmentType: { type: String, default: "Internship" },
    location: { type: String, default: "" },
    startDate: { type: String, required: true },
    endDate: { type: String, default: "" },
    isCurrent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["current", "upcoming", "ongoing", "completed"],
      default: "completed",
    },
    description: { type: String, default: "" },
    responsibilities: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

export type Experience = InferSchemaType<typeof experienceSchema>;
export const ExperienceModel = model("Experience", experienceSchema);

// ─── Education ────────────────────────────────────────────────────────────────
const educationSchema = new Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    field: { type: String, default: "" },
    period: { type: String, default: "" },
    description: { type: String, default: "" },
    highlights: { type: [String], default: [] },
    icon: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

export type Education = InferSchemaType<typeof educationSchema>;
export const EducationModel = model("Education", educationSchema);

// ─── Certifications & achievements ────────────────────────────────────────────
const certificationSchema = new Schema(
  {
    title: { type: String, required: true },
    issuer: { type: String, default: "" },
    year: { type: String, default: "" },
    credentialUrl: { type: String, default: "" },
    icon: { type: String, default: "" },
    accentColor: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

export type Certification = InferSchemaType<typeof certificationSchema>;
export const CertificationModel = model("Certification", certificationSchema);
