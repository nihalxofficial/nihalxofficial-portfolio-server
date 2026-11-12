import express, { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate";
import { listImages, removeImage, uploadImage, uploadImageFromUrl } from "./media.controller";
import { listMediaQuerySchema, uploadBase64Schema, uploadFromUrlSchema } from "./media.validator";

export const mediaRouter = Router();

// Everything below is admin-only, checked before any body is parsed.
mediaRouter.use(requireAuth, requireRole("admin"));

// Support up to 14MB base64 images before the default limit
mediaRouter.use(express.json({ limit: "14mb" }));

mediaRouter.get("/", validate({ query: listMediaQuerySchema }), listImages);
mediaRouter.post("/", validate({ body: uploadBase64Schema }), uploadImage);
mediaRouter.post("/from-url", validate({ body: uploadFromUrlSchema }), uploadImageFromUrl);
mediaRouter.delete("/:id", removeImage);
