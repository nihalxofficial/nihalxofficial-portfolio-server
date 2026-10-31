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

// ─── Contact messages ─────────────────────────────────────────────────────────
const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: "Portfolio inquiry", maxlength: 200 },
    message: { type: String, required: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["unread", "read", "replied", "archived"],
      default: "unread",
      index: true,
    },
    // Approximate, IP-derived location only — never raw IP storage.
    location: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    emailDelivered: { type: Boolean, default: false },
    // Replies sent from the dashboard inbox. The visitor's message is never
    // edited — the thread only ever grows.
    replies: [
      {
        to: { type: String, default: "" },
        subject: { type: String, default: "" },
        body: { type: String, default: "" },
        delivered: { type: Boolean, default: false },
        sentAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, versionKey: false },
);

contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ status: 1, createdAt: -1 });

export type ContactMessage = InferSchemaType<typeof contactMessageSchema>;
export const ContactMessageModel = model("ContactMessage", contactMessageSchema);
