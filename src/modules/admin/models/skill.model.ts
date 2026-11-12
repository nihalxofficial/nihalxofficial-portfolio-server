import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
} as const;

const skillSchema = new Schema(
  {
    name: { type: String, required: true, max: 80 },
    category: { type: String, required: true, max: 60 },
    icon: { type: String, max: 60 },
    brandColor: { type: String, max: 30 },
    proficiency: {
      type: String,
      enum: ["learning", "familiar", "advanced", "expert"],
    },
    ...orderedFields,
  },
  baseOptions,
);

export type Skill = InferSchemaType<typeof skillSchema>;
export const SkillModel = model("Skill", skillSchema);