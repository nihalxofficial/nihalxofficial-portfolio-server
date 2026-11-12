import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const sectionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, default: "" },
    heading: { type: String, default: "" },
    description: { type: String, default: "" },
    items: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  baseOptions,
);

export type Section = InferSchemaType<typeof sectionSchema>;
export const SectionModel = model("Section", sectionSchema);