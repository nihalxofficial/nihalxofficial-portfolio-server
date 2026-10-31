import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = {
  timestamps: true,
  versionKey: false,
} as const;

/** Reusable building block for ordered, toggleable, singleton content. */
const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
};

// ─── Hero ─────────────────────────────────────────────────────────────────────
const heroSchema = new Schema(
  {
    key: { type: String, default: "main", unique: true, immutable: true },
    greeting: { type: String, default: "Hi, I'm" },
    name: { type: String, required: true },
    highlightedName: { type: String, default: "" },
    role: { type: String, required: true },
    description: { type: String, required: true },
    availability: {
      label: { type: String, default: "Available for remote work" },
      isAvailable: { type: Boolean, default: true },
    },
    primaryCta: {
      label: { type: String, default: "View My Projects" },
      href: { type: String, default: "#projects" },
    },
    secondaryCta: {
      label: { type: String, default: "Download CV" },
      href: { type: String, default: "/Nihal_Full_Stack_Developer_Resume.pdf" },
    },
    terminal: {
      command: { type: String, default: "whoami" },
      lines: { type: [String], default: [] },
    },
    portraitUrl: { type: String, default: "" },
    ...orderedFields,
  },
  baseOptions,
);
export type Hero = InferSchemaType<typeof heroSchema>;
export const HeroModel = model("Hero", heroSchema);

// ─── About ────────────────────────────────────────────────────────────────────
const aboutSchema = new Schema(
  {
    key: { type: String, default: "main", unique: true, immutable: true },
    label: { type: String, default: "About Me" },
    heading: { type: String, default: "A little about me" },
    paragraphs: { type: [String], default: [] },
    portraitUrl: { type: String, default: "" },
    codeCard: {
      name: String,
      role: String,
      location: String,
      education: String,
      experience: String,
      passion: { type: [String], default: [] },
    },
    highlights: [
      {
        icon: String,
        label: String,
        value: String,
      },
    ],
    signature: { type: String, default: "" },
    ...orderedFields,
  },
  baseOptions,
);
export type About = InferSchemaType<typeof aboutSchema>;
export const AboutModel = model("About", aboutSchema);

// ─── Statistics ───────────────────────────────────────────────────────────────
const statisticSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    ...orderedFields,
  },
  baseOptions,
);
export type Statistic = InferSchemaType<typeof statisticSchema>;
export const StatisticModel = model("Statistic", statisticSchema);

// ─── Services ─────────────────────────────────────────────────────────────────
const serviceSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "" },
    ...orderedFields,
  },
  baseOptions,
);
export type Service = InferSchemaType<typeof serviceSchema>;
export const ServiceModel = model("Service", serviceSchema);

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: "" },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    avatarUrl: { type: String, default: "" },
    ...orderedFields,
  },
  baseOptions,
);
export type Testimonial = InferSchemaType<typeof testimonialSchema>;
export const TestimonialModel = model("Testimonial", testimonialSchema);

// ─── Navigation ───────────────────────────────────────────────────────────────
const navigationSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    ...orderedFields,
  },
  baseOptions,
);
export type Navigation = InferSchemaType<typeof navigationSchema>;
export const NavigationModel = model("Navigation", navigationSchema);

// ─── Section management ───────────────────────────────────────────────────────
const sectionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, default: "" },
    heading: { type: String, default: "" },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  baseOptions,
);
export type Section = InferSchemaType<typeof sectionSchema>;
export const SectionModel = model("Section", sectionSchema);

// ─── Site settings (SEO, social, contact) ─────────────────────────────────────
const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: "main", unique: true, immutable: true },
    siteName: { type: String, default: "" },
    siteUrl: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    ogImageUrl: { type: String, default: "" },
    // Theme aware brand assets. Empty values fall back to the generated
    // gradient mark on the site, so a fresh install still looks complete.
    branding: {
      navLogoLight: { type: String, default: "" },
      navLogoDark: { type: String, default: "" },
      footerLogoLight: { type: String, default: "" },
      footerLogoDark: { type: String, default: "" },
      faviconUrl: { type: String, default: "" },
      logoAlt: { type: String, default: "" },
    },
    contact: {
      email: String,
      phone: String,
      location: String,
      availability: String,
    },
    socialLinks: [
      {
        platform: String,
        url: String,
        icon: String,
      },
    ],
    resumeUrl: { type: String, default: "" },
  },
  baseOptions,
);
export type SiteSettings = InferSchemaType<typeof siteSettingsSchema>;
export const SiteSettingsModel = model("SiteSettings", siteSettingsSchema);
