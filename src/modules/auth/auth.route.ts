import { Router } from "express";
import { isFirebaseConfigured } from "../../config/firebase";
import { env } from "../../config/env";
import { requireAdmin } from "../../middlewares/auth";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const router = Router();

/** Confirms to the dashboard that the token is valid AND on the allowlist. */
router.get(
  "/session",
  requireAdmin,
  catchAsync(async (req, res) =>
    sendResponse(res, 200, {
      message: "Session verified",
      data: {
        uid: req.admin?.uid,
        email: req.admin?.email ?? null,
        name: req.admin?.name ?? null,
        firebaseConfigured: isFirebaseConfigured(),
        adminCount: env.adminUids.length,
      },
    }),
  ),
);

export const authRouter = router;
