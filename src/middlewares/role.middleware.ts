import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { isAdminRole, normalizeRole, hasAnyRole } from "../utils/roles";

/**
 * Allows the request only when the caller holds one of `allowedRoles`.
 */
export function requireRole(...allowedRoles: string[]) {
  const allowed = allowedRoles.map(normalizeRole);

  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    const isAllowed = hasAnyRole(user?.role, allowed);
    const isAdminAsking = allowed.includes("admin") && isAdminRole(user?.role);

    if (!isAllowed && !isAdminAsking) {
      return next(new ApiError(403, "You don't have permission to perform this action"));
    }

    next();
  };
}

/** Admin-only shortcut */
export const requireAdmin = [
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
    const isAdmin = isAdminRole(req.user.role);

    if (!isAdmin) {
      return next(new ApiError(403, "Administrator access required"));
    }
    next();
  },
];
