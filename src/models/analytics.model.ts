import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * One analytics event, appended per navigation. A visitor's journey is a mix of
 * `view` (a page was opened — the only kind counted as a page view), `leave`
 * (carries the seconds spent on that page) and `beat` (a periodic ping that
 * keeps "online now" fresh during a long read). Sessions are reconstructed by
 * grouping on `sessionId`, and "online now" is any session with an event in the
 * last few minutes — so real-time needs only polling, no sockets. Everything is
 * derived request-side: no raw IP is stored, geolocation comes from edge
 * headers, and there is no filesystem or long-lived state (Vercel-safe).
 */
const visitSchema = new Schema(
  {
    kind: { type: String, enum: ["view", "leave", "beat"], default: "view", index: true },
    sessionId: { type: String, required: true, index: true },
    visitorId: { type: String, default: "", index: true },
    path: { type: String, required: true },
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

export type Visit = InferSchemaType<typeof visitSchema>;
export const VisitModel = model("Visit", visitSchema);
