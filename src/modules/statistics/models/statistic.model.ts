import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
} as const;

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