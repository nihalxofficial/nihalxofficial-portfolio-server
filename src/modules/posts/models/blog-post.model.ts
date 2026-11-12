import { Schema, model, type InferSchemaType } from "mongoose";

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" },
    tags: { type: [String], default: [] },
    category: { type: String, default: "Engineering" },
    readingTime: { type: String, default: "" },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
    },
  },
  { timestamps: true, versionKey: false },
);

blogSchema.index({ isPublished: 1, publishedAt: -1 });

export type BlogPost = InferSchemaType<typeof blogSchema>;
export const BlogPostModel = model("BlogPost", blogSchema);