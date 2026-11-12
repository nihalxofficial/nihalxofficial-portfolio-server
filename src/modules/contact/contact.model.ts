import { Schema, model, type InferSchemaType } from "mongoose";

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
    location: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    emailDelivered: { type: Boolean, default: false },
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