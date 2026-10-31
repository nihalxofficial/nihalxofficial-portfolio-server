import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { parsePagination, sendResponse } from "../../utils/sendResponse";
import {
  deleteMedia,
  listMedia,
  uploadBase64,
  uploadFromUrl,
} from "./media.service";
import type { UploadFromUrlInput } from "./media.validator";

/** JSON upload: the dashboard reads the file with FileReader and posts it. */
export const uploadImage = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as {
    image: string;
    mimeType?: string;
    name?: string;
    folder?: string;
  };

  const asset = await uploadBase64({
    image: body.image,
    mimeType: body.mimeType,
    name: body.name,
    folder: body.folder,
    uploadedBy: req.admin?.uid,
  });

  return sendResponse(res, 201, { message: "Image uploaded", data: asset });
});

/** Import an image that is already hosted somewhere else. */
export const uploadImageFromUrl = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as UploadFromUrlInput;

  const asset = await uploadFromUrl({
    url: body.url,
    folder: body.folder,
    name: body.name,
    uploadedBy: req.admin?.uid,
  });

  return sendResponse(res, 201, { message: "Image imported", data: asset });
});

export const listImages = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
    page: 1,
    limit: 24,
  });

  const result = await listMedia({
    folder: typeof req.query.folder === "string" ? req.query.folder : undefined,
    search: typeof req.query.search === "string" ? req.query.search : undefined,
    page,
    limit,
    skip,
  });

  return sendResponse(res, 200, {
    message: "Media library",
    data: result.items,
    meta: result.meta,
  });
});

export const removeImage = catchAsync(async (req: Request, res: Response) => {
  const result = await deleteMedia(String(req.params.id));
  return sendResponse(res, 200, { message: "Image deleted", data: result });
});
