import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
} as const;

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