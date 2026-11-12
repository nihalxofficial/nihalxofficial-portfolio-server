import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
} as const;

const testimonialSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: "" },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    avatarUrl: { type: String, default: "" },
    ...orderedFields,
  },
  baseOptions,
);

export type Testimonial = InferSchemaType<typeof testimonialSchema>;
export const TestimonialModel = model("Testimonial", testimonialSchema);