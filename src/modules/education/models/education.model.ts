import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
} as const;

const educationSchema = new Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    field: { type: String, max: 120 },
    period: { type: String, max: 60 },
    description: { type: String },
    highlights: { type: [String], default: [] },
    icon: { type: String, max: 60 },
    ...orderedFields,
  },
  baseOptions,
);

export type Education = InferSchemaType<typeof educationSchema>;
export const EducationModel = model("Education", educationSchema);