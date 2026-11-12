import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { isAdminRole, normalizeRole, hasAnyRole } from "../utils/roles";

/**
 * Allows the request only when the caller holds one of `allowedRoles`.
 * Matches the role middleware pattern from Sparq-Server.
 */
export function requireRole(...allowedRoles: string[]) {
  const allowed = allowedRoles.map(normalizeRole);

  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    const isAllowed = hasAnyRole(user?.roles, allowed, user?.role);
    const isAdminAsking = allowed.includes("admin") && (isAdminRole(user?.role) || isAdminRole(user?.activeRole));

    if (!isAllowed && !isAdminAsking) {
      return next(new ApiError(403, "You don't have permission to perform this action"));
    }

    next();
  };
}

/** Admin-only shortcut matching Sparq-Server standards */
export const requireAdmin = [
  (req: Request, res: Response, next: NextFunction) => {
    // If auth middleware hasn't run yet, we handle gracefully
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }
    const isAdmin =
      isAdminRole(req.user.role) ||
      isAdminRole(req.user.activeRole) ||
      (Array.isArray(req.user.roles) && req.user.roles.includes("admin"));

    if (!isAdmin) {
      return next(new ApiError(403, "Administrator access required"));
    }
    next();
  },
];

