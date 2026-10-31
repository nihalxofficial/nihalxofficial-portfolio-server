import express, { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { uploadImage, uploadImageFromUrl, listImages, removeImage } from "./media.controller";
import { listMediaQuerySchema, uploadBase64Schema, uploadFromUrlSchema } from "./media.validator";

const router = Router();

// Everything below is admin-only, checked before any body is parsed.
router.use(requireAdmin);

// This route is mounted before the global json parser on purpose: an 8 MB
// image becomes roughly 11 MB of base64, which must not be rejected by the
// small global limit used everywhere else.
router.use(express.json({ limit: "14mb" }));

router.get("/", validate({ query: listMediaQuerySchema }), listImages);
router.post("/", validate({ body: uploadBase64Schema }), uploadImage);
router.post("/from-url", validate({ body: uploadFromUrlSchema }), uploadImageFromUrl);
router.delete("/:id", removeImage);

export const mediaAdminRouter = router;
