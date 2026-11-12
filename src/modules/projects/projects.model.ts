import { Schema, model, type InferSchemaType } from "mongoose";

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, required: true },
    description: { type: String, default: "" },

    thumbnailUrl: { type: String, default: "" },
    screenshots: { type: [String], default: [] },

    category: { type: String, default: "Full-Stack", index: true },
    techStack: { type: [String], default: [] },
    features: { type: [String], default: [] },
    challenges: { type: String, default: "" },
    improvements: { type: String, default: "" },

    liveUrl: { type: String, default: "" },
    sourceUrl: { type: String, default: "" },

    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },

    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
    },
  },
  { timestamps: true, versionKey: false },
);

projectSchema.index({ isPublished: 1, order: 1, createdAt: -1 });
projectSchema.index({ title: "text", shortDescription: "text", techStack: "text" });

export type Project = InferSchemaType<typeof projectSchema>;
export const ProjectModel = model("Project", projectSchema);