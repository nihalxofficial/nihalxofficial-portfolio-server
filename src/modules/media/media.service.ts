import { env } from "../../config/env";
import { MediaAssetModel } from "./media.model";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta, type PaginationMeta } from "../../utils/sendResponse";

const IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload";
const MAX_BYTES = 8 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export function isMediaConfigured(): boolean {
  return Boolean(env.IMGBB_API_KEY);
}

interface ImgbbResponse {
  data?: {
    id: string;
    url: string;
    display_url: string;
    url_viewer: string;
    delete_url?: string;
    width?: string;
    height?: string;
    size?: string;
    image?: { mime?: string; filename?: string };
    thumb?: { url?: string };
  };
  success?: boolean;
  status?: number;
  error?: { code?: number; message?: string };
}

function requireKey(): string {
  if (!env.IMGBB_API_KEY) {
    throw ApiError.serviceUnavailable(
      "Image uploads are not configured yet. Set IMGBB_API_KEY on the server.",
    );
  }
  return env.IMGBB_API_KEY;
}

async function callImgbb(body: URLSearchParams): Promise<ImgbbResponse> {
  let response: Response;
  try {
    response = await fetch(`${IMGBB_ENDPOINT}?key=${encodeURIComponent(requireKey())}`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[media] imgbb request failed:", (error as Error).message);
    throw ApiError.badGateway("Could not reach the image host. Try again.");
  }

  const payload = (await response.json().catch(() => ({}))) as ImgbbResponse;

  if (!response.ok || payload.success === false || !payload.data?.url) {
    const reason = payload.error?.message ?? `HTTP ${response.status}`;
    // eslint-disable-next-line no-console
    console.error("[media] imgbb rejected the upload:", reason);
    throw ApiError.badGateway(`Image upload failed: ${reason}`);
  }

  return payload;
}

async function persist(payload: ImgbbResponse, folder: string, uploadedBy: string) {
  const data = payload.data as NonNullable<ImgbbResponse["data"]>;

  return MediaAssetModel.create({
    name: data.image?.filename || data.id,
    url: data.url,
    displayUrl: data.display_url || data.url,
    thumbnailUrl: data.thumb?.url || data.display_url || data.url,
    deleteUrl: data.delete_url || "",
    provider: "imgbb",
    providerId: data.id,
    mimeType: data.image?.mime || "",
    sizeBytes: Number(data.size ?? 0) || 0,
    width: Number(data.width ?? 0) || 0,
    height: Number(data.height ?? 0) || 0,
    folder,
    uploadedBy,
  });
}

export function assertUploadable(file: { mimetype: string; size: number }) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw ApiError.badRequest("Only jpg, png, webp, gif and avif images are accepted");
  }
  if (file.size > MAX_BYTES) {
    throw ApiError.badRequest("Image is larger than 8 MB, compress it first");
  }
}

export function decodeImagePayload(payload: { image: string; mimeType?: string }) {
  const raw = payload.image.trim();
  if (!raw) throw ApiError.badRequest("Image data is empty");

  let mimeType = payload.mimeType?.trim() ?? "";
  let base64 = raw;

  const dataUrl = /^data:([^;,]+);base64,(.*)$/s.exec(raw);
  if (dataUrl) {
    mimeType = dataUrl[1];
    base64 = dataUrl[2];
  }

  base64 = base64.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");

  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw ApiError.badRequest("Image must be base64 encoded or a base64 data url");
  }

  const size = Math.floor((base64.length * 3) / 4);
  return { base64, mimeType, size };
}

export async function uploadBase64(input: {
  image: string;
  mimeType?: string;
  name?: string;
  folder?: string;
  uploadedBy?: string;
}) {
  const { base64, mimeType, size } = decodeImagePayload(input);
  assertUploadable({ mimetype: mimeType, size });

  const body = new URLSearchParams({ image: base64 });
  if (input.name) body.set("name", input.name.slice(0, 120));
  if (env.IMGBB_EXPIRATION) body.set("expiration", String(env.IMGBB_EXPIRATION));

  const payload = await callImgbb(body);
  return persist(payload, input.folder ?? "", input.uploadedBy ?? "");
}

export async function uploadFromUrl(input: {
  url: string;
  folder?: string;
  name?: string;
  uploadedBy?: string;
}) {
  const body = new URLSearchParams({ image: input.url });
  if (input.name) body.set("name", input.name);
  if (env.IMGBB_EXPIRATION) body.set("expiration", String(env.IMGBB_EXPIRATION));

  const payload = await callImgbb(body);
  return persist(payload, input.folder ?? "", input.uploadedBy ?? "");
}

export async function listMedia(params: {
  folder?: string;
  search?: string;
  page: number;
  limit: number;
  skip: number;
}): Promise<{ items: unknown[]; meta: PaginationMeta }> {
  const filter: Record<string, unknown> = {};
  if (params.folder) filter.folder = params.folder;
  if (params.search) {
    const term = new RegExp(params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: term }, { folder: term }];
  }

  const [items, total] = await Promise.all([
    MediaAssetModel.find(filter)
      .select("-deleteUrl")
      .sort({ createdAt: -1 })
      .skip(params.skip)
      .limit(params.limit)
      .lean(),
    MediaAssetModel.countDocuments(filter),
  ]);

  return { items, meta: buildPaginationMeta(params.page, params.limit, total) };
}

export async function deleteMedia(id: string) {
  const asset = await MediaAssetModel.findById(id);
  if (!asset) throw ApiError.notFound("Image not found");

  if (asset.deleteUrl) {
    try {
      await fetch(asset.deleteUrl, { method: "GET", signal: AbortSignal.timeout(15_000) });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[media] remote delete failed:", (error as Error).message);
    }
  }

  await asset.deleteOne();
  return { id, deleted: true };
}
