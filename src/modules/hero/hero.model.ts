import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
} as const;

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
    rotator: {
      prefix: { type: String, default: "" },
      lines: { type: [String], default: [] },
    },
    portraitUrl: { type: String, default: "" },
    tagline: { type: String, default: "" },
    ...orderedFields,
  },
  baseOptions,
);

export type Hero = InferSchemaType<typeof heroSchema>;
export const HeroModel = model("Hero", heroSchema);