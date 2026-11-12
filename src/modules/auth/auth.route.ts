import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const router = Router();

router.get(
  "/status",
  requireAuth,
  catchAsync(async (req, res) => {
    const user = req.user;
    const isAdmin =
      user?.role === "admin" ||
      user?.activeRole === "admin" ||
      (Array.isArray(user?.roles) && user.roles.includes("admin"));

    return sendResponse(res, 200, {
      message: "Token verified",
      data: {
        uid: user?.id ?? "",
        email: user?.email ?? null,
        name: user?.name ?? null,
        role: user?.role,
        roles: user?.roles,
        isAdmin,
        firebaseConfigured: true,
        adminCount: isAdmin ? 1 : 0,
      },
    });
  }),
);

router.get(
  "/session",
  requireAuth,
  requireRole("admin"),
  catchAsync(async (req, res) => {
    const user = req.user;
    return sendResponse(res, 200, {
      message: "Session verified",
      data: {
        uid: user?.id,
        email: user?.email ?? null,
        name: user?.name ?? null,
        role: user?.role,
        roles: user?.roles,
        firebaseConfigured: true,
        adminCount: 1,
      },
    });
  }),
);

export const authRouter = router;
export default router;
