import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const siteSettingsSchema = new Schema(
  {
    key: { type: String, default: "main", unique: true, immutable: true },
    siteName: { type: String, default: "" },
    siteUrl: { type: String, default: "" },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    ogImageUrl: { type: String, default: "" },
    branding: {
      navLogoLight: { type: String, default: "" },
      navLogoDark: { type: String, default: "" },
      footerLogoLight: { type: String, default: "" },
      footerLogoDark: { type: String, default: "" },
      faviconUrl: { type: String, default: "" },
      logoAlt: { type: String, default: "" },
      mark: { type: String, default: "" },
      wordmark: { type: String, default: "" },
    },
    typography: {
      sans: { type: String, default: "" },
      display: { type: String, default: "" },
      mono: { type: String, default: "" },
    },
    theme: {
      accentId: { type: String, default: "" },
      backgroundEffect: {
        type: String,
        enum: ["dna", "rain", "none", ""],
        default: "",
      },
      palette: {
        primary: { type: String, default: "" },
        secondary: { type: String, default: "" },
        background: { type: String, default: "" },
        text: { type: String, default: "" },
      },
    },
    contact: {
      email: String,
      phone: String,
      location: String,
      availability: String,
      mapLat: { type: String, default: "" },
      mapLng: { type: String, default: "" },
      mapZoom: { type: Number, min: 1, max: 20, default: 13 },
      mapEmbedUrl: { type: String, default: "" },
    },
    socialLinks: [
      {
        platform: String,
        url: String,
        icon: String,
      },
    ],
    footer: {
      tagline: { type: String, default: "" },
      description: { type: String, default: "" },
      navigationHeading: { type: String, default: "" },
      elsewhereHeading: { type: String, default: "" },
      resumeLabel: { type: String, default: "" },
      ctaLabel: { type: String, default: "" },
      copyright: { type: String, default: "" },
      builtWith: { type: String, default: "" },
      stack: { type: [String], default: [] },
    },
    resumeUrl: { type: String, default: "" },
  },
  baseOptions,
);

export type SiteSettings = InferSchemaType<typeof siteSettingsSchema>;
export const SiteSettingsModel = model("SiteSettings", siteSettingsSchema);