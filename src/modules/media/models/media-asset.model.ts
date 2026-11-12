import { Schema, model, type InferSchemaType } from "mongoose";

const mediaAssetSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    displayUrl: { type: String, default: "" },
    thumbnailUrl: { type: String, default: "" },
    deleteUrl: { type: String, default: "" },

    provider: { type: String, default: "imgbb", index: true },
    providerId: { type: String, default: "" },

    mimeType: { type: String, default: "" },
    sizeBytes: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },

    folder: { type: String, default: "", index: true },
    uploadedBy: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

mediaAssetSchema.index({ createdAt: -1 });

export type MediaAsset = InferSchemaType<typeof mediaAssetSchema>;
export const MediaAssetModel = model("MediaAsset", mediaAssetSchema);