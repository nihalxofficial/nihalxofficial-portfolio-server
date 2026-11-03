import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * One analytics event, appended per navigation or project interaction.
 * Supports page views, leave events (duration), heartbeat pings, and project clicks/views.
 */
const visitSchema = new Schema(
  {
    kind: { type: String, enum: ["view", "leave", "beat", "click"], default: "view", index: true },
    sessionId: { type: String, required: true, index: true },
    visitorId: { type: String, default: "", index: true },
    path: { type: String, required: true },
    projectId: { type: String, default: "", index: true },
    eventType: { type: String, default: "page_view", index: true },
    referrer: { type: String, default: "" },
    // Referrer host (or "Direct" / "Internal") so the source list is cheap.
    source: { type: String, default: "Direct" },
    // Time on this page, sent when the visitor navigates away or closes.
    durationMs: { type: Number, default: 0 },

    browser: { type: String, default: "Unknown" },
    browserVersion: { type: String, default: "" },
    os: { type: String, default: "Unknown" },
    device: { type: String, default: "desktop" },

    country: { type: String, default: "" },
    countryCode: { type: String, default: "", index: true },
    region: { type: String, default: "" },
    city: { type: String, default: "" },
    lat: { type: Number },
    lng: { type: Number },

    isBot: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false },
);

visitSchema.index({ createdAt: -1 });
visitSchema.index({ isBot: 1, createdAt: -1 });
visitSchema.index({ kind: 1, createdAt: -1 });
visitSchema.index({ projectId: 1, createdAt: -1 });
visitSchema.index({ eventType: 1, createdAt: -1 });

export type Visit = InferSchemaType<typeof visitSchema>;
export const VisitModel = model("Visit", visitSchema);
