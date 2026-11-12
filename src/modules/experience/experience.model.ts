import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
} as const;

const experienceSchema = new Schema(
  {
    organization: { type: String, required: true },
    role: { type: String, required: true },
    employmentType: { type: String, max: 40 },
    location: { type: String, max: 120 },
    startDate: { type: String, required: true, max: 40 },
    endDate: { type: String, max: 40 },
    isCurrent: { type: Boolean },
    status: {
      type: String,
      enum: ["current", "upcoming", "ongoing", "completed"],
    },
    description: { type: String },
    responsibilities: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    ...orderedFields,
  },
  baseOptions,
);

export type Experience = InferSchemaType<typeof experienceSchema>;
export const ExperienceModel = model("Experience", experienceSchema);