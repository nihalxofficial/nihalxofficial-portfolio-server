import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";
import { createRemoteJWKSet, jwtVerify } from "jose-cjs";

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      admin?: AuthUser;
    }
  }
}

const clientUrl =
  process.env.CLIENT_URL ||
  process.env.NEXT_PUBLIC_CLIENT_URL ||
  env.FRONTEND_URL ||
  "http://localhost:3000";

/**
 * The public site origin is the JWT issuer and, from a browser, the JWKS host.
 * Inside a container network the API may not be able to resolve that public
 * origin, so AUTH_JWKS_URL can point at the web service directly while the
 * issuer check keeps using the public URL.
 */
const jwksUrl = process.env.AUTH_JWKS_URL || `${clientUrl}/api/auth/jwks`;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }
  return jwks;
}

function readToken(req: Request): string | undefined {
  return (
    req.headers.authorization?.split(" ")[1] ||
    (req.query.token as string | undefined) ||
    req.cookies?.token ||
    req.cookies?.session_token
  );
}

async function userFromJwt(token: string): Promise<AuthUser> {
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: clientUrl,
  });

  return {
    id: payload.sub as string,
    email: payload.email as string | undefined,
    role: payload.role as string | undefined,
  };
}

async function userFromSession(token: string): Promise<AuthUser | null> {
  const mongoose = (await import("mongoose")).default;
  const db = mongoose.connection.db;
  if (!db) return null;

  const session = await db.collection("session").findOne({ token });
  if (!session) return null;

  const rawUserId = session.userId;
  const objectId = mongoose.Types.ObjectId.isValid(String(rawUserId))
    ? new mongoose.Types.ObjectId(String(rawUserId))
    : rawUserId;

  const user = await db.collection("user").findOne({
    $or: [{ _id: rawUserId }, { _id: objectId }],
  });
  if (!user) return null;

  return shapeFromRecord(
    { id: String(user._id), email: user.email, name: user.name },
    user,
  );
}

function shapeFromRecord(base: AuthUser, record: any): AuthUser {
  const adminEmails = (
    process.env.ADMIN_EMAILS ||
    process.env.ADMIN_EMAIL ||
    "mdnihaluddinbijoy@gmail.com"
  )
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const email = (record?.email || base.email || "").toLowerCase();
  const isAdmin = adminEmails.includes(email);
  const role: string = isAdmin ? "admin" : record?.role || base.role || "user";

  return {
    ...base,
    role,
  };
}

async function withCurrentRole(user: AuthUser): Promise<AuthUser | null> {
  try {
    const mongoose = (await import("mongoose")).default;
    const db = mongoose.connection.db;
    if (!db) return user;

    const objectId = mongoose.Types.ObjectId.isValid(user.id)
      ? new mongoose.Types.ObjectId(user.id)
      : user.id;

    const record: any = await db.collection("user").findOne({
      $or: [{ _id: user.id }, { _id: objectId }],
    } as any);

    if (!record) return user;
    return shapeFromRecord(user, record);
  } catch {
    return user;
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = readToken(req);
  if (!token) {
    return next(new ApiError(401, "No authentication token provided"));
  }

  let user: AuthUser | null = null;
  let resolvedFromJwt = false;

  try {
    user = await userFromJwt(token);
    resolvedFromJwt = true;
  } catch {
    try {
      user = await userFromSession(token);
    } catch {
      user = null;
    }
  }

  if (user && resolvedFromJwt) {
    user = await withCurrentRole(user);
  }

  if (!user) {
    return next(new ApiError(401, "Invalid or expired token"));
  }

  req.user = user;
  req.admin = user;
  next();
}

/** Legacy alias for routes checking general user auth */
export const requireUser = requireAuth;

