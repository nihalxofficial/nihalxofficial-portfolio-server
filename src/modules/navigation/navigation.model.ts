import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
} as const;

const navigationSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
    icon: { type: String, default: "" },
    isPrimary: { type: Boolean, default: false },
    opensInNewTab: { type: Boolean, default: false },
    ...orderedFields,
  },
  baseOptions,
);

export type Navigation = InferSchemaType<typeof navigationSchema>;
export const NavigationModel = model("Navigation", navigationSchema);