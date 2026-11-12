import { Schema, model, type InferSchemaType } from "mongoose";

const baseOptions = { timestamps: true, versionKey: false } as const;

const orderedFields = {
  order: { type: Number, default: 0, index: true },
  isVisible: { type: Boolean, default: true, index: true },
} as const;

const certificationSchema = new Schema(
  {
    title: { type: String, required: true },
    issuer: { type: String, max: 160 },
    year: { type: String, max: 10 },
    credentialUrl: { type: String },
    icon: { type: String, max: 60 },
    accentColor: { type: String, max: 30 },
    ...orderedFields,
  },
  baseOptions,
);

export type Certification = InferSchemaType<typeof certificationSchema>;
export const CertificationModel = model("Certification", certificationSchema);