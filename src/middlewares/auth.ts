import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { isFirebaseConfigured, verifyIdToken } from "../config/firebase";
import { ApiError } from "../utils/apiError";

export interface AdminUser {
  uid: string;
  email?: string;
  name?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminUser;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();

  const cookieToken = req.cookies?.admin_token;
  if (typeof cookieToken === "string" && cookieToken.length > 0) return cookieToken;

  return null;
}

/**
 * Firebase ID token verification + UID allowlist.
 * The client never decides whether it is an admin — only ADMIN_UIDS does.
 */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!isFirebaseConfigured()) {
      throw ApiError.serviceUnavailable(
        "Admin authentication is not configured on this server yet.",
      );
    }

    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized("Missing authentication token");

    const decoded = await verifyIdToken(token);

    if (env.adminUids.length === 0) {
      throw ApiError.forbidden("No admin accounts are provisioned (ADMIN_UIDS is empty)");
    }

    if (!env.adminUids.includes(decoded.uid)) {
      throw ApiError.forbidden("This account is not authorised to access the dashboard");
    }

    req.admin = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    const code = (error as { code?: string }).code;
    if (code === "auth/id-token-expired") {
      next(ApiError.unauthorized("Session expired, please sign in again"));
      return;
    }
    if (code === "auth/argument-error" || code === "auth/invalid-id-token") {
      next(ApiError.unauthorized("Invalid authentication token"));
      return;
    }

    next(error);
  }
}
