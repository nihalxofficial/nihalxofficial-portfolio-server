import { Router } from "express";
import { isFirebaseConfigured } from "../../config/firebase";
import { env } from "../../config/env";
import { requireAdmin, requireUser } from "../../middlewares/auth";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const router = Router();

/**
 * Token probe for register/login screens.
 *
 * A brand new Firebase account is allowed to call this so the UI can show its
 * UID ("add this to ADMIN_UIDS"), but the response never exposes content.
 */
router.get(
  "/status",
  requireUser,
  catchAsync(async (req, res) => {
    const uid = req.admin?.uid ?? "";

    return sendResponse(res, 200, {
      message: "Token verified",
      data: {
        uid,
        email: req.admin?.email ?? null,
        name: req.admin?.name ?? null,
        isAdmin: env.adminUids.includes(uid),
        firebaseConfigured: isFirebaseConfigured(),
        adminCount: env.adminUids.length,
      },
    });
  }),
);

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
