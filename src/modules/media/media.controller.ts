import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { deleteMedia, listMedia, uploadBase64, uploadFromUrl } from "./media.service";
import type { UploadFromUrlInput } from "./media.validator";

export const listImages = catchAsync(async (req: Request, res: Response) => {
  const folder = typeof req.query.folder === "string" ? req.query.folder : undefined;
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, Number(req.query.limit) || 24));

  const { items, meta } = await listMedia({
    folder,
    search,
    page,
    limit,
    skip: (page - 1) * limit,
  });

  return sendResponse(res, 200, {
    message: "Media loaded",
    data: items,
    meta,
  });
});

export const uploadImage = catchAsync(async (req: Request, res: Response) => {
  const asset = await uploadBase64({
    ...req.body,
    uploadedBy: (req.user as any)?.email ?? "",
  });

  return sendResponse(res, 201, {
    message: "Image uploaded",
    data: asset,
  });
});

export const uploadImageFromUrl = catchAsync(async (req: Request, res: Response) => {
  const input = req.body as UploadFromUrlInput;
  const asset = await uploadFromUrl({
    ...input,
    uploadedBy: (req.user as any)?.email ?? "",
  });

  return sendResponse(res, 201, {
    message: "Image imported",
    data: asset,
  });
});

export const removeImage = catchAsync(async (req: Request, res: Response) => {
  const result = await deleteMedia(String(req.params.id));
  return sendResponse(res, 200, {
    message: "Image deleted",
    data: result,
  });
});
