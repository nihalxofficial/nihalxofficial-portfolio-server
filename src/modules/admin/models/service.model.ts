import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
} as const;

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