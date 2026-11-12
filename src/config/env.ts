import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Every environment variable the server needs is declared and validated here.
 * The process refuses to boot with a broken configuration instead of failing
 * later, in the middle of a request.
 */
/**
 * An empty line in .env (`IMGBB_EXPIRATION=`) means "not configured".
 * Without this, every blank value would be read as 0/false and fail validation.
 */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  CLIENT_URL: z.string().default("http://localhost:3000"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  // Overrides the database name inside the URI (the URI often omits it).
  MONGODB_DATABASE: z.string().default("portfolio"),

  ADMIN_EMAILS: z.string().default("mdnihaluddinbijoy@gmail.com"),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash-lite"),
  // Tried in order when the primary model is overloaded (comma separated).
  GEMINI_FALLBACK_MODELS: z
    .preprocess(blankToUndefined, z.string().optional())
    .transform((value) => value ?? "gemini-3.8-flash,gemini-3.5-flash-lite"),

  // Any SMTP provider: Gmail + app password, Brevo, Resend, Mailgun, Zoho...
  SMTP_HOST: z.preprocess(blankToUndefined, z.string().optional()),
  SMTP_PORT: z.preprocess(blankToUndefined, z.coerce.number().int().positive().default(587)),
  SMTP_SECURE: z.preprocess(
    blankToUndefined,
    z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
  ),
  SMTP_USER: z.preprocess(blankToUndefined, z.string().optional()),
  SMTP_PASSWORD: z.preprocess(blankToUndefined, z.string().optional()),
  SMTP_FROM: z.preprocess(blankToUndefined, z.string().optional()),
  CONTACT_RECEIVER_EMAIL: z.preprocess(blankToUndefined, z.string().optional()),

  // Image hosting for the dashboard media library.
  IMGBB_API_KEY: z.preprocess(blankToUndefined, z.string().optional()),
  // Optional auto-expiry in seconds (60 .. 15552000). Empty means permanent.
  IMGBB_EXPIRATION: z.preprocess(
    blankToUndefined,
    z.coerce.number().int().min(60).max(15_552_000).optional(),
  ),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  • ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  // eslint-disable-next-line no-console
  console.error(`\n[env] Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === "production",
  adminEmails: raw.ADMIN_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  corsOrigins: raw.FRONTEND_URL.split(",")
    .map((origin) => origin.trim())
    .concat(["http://localhost:3000", "http://127.0.0.1:3000"])
    .filter(Boolean),
  smtpConfigured: Boolean(raw.SMTP_HOST && raw.SMTP_USER && raw.SMTP_PASSWORD),
  emailFrom: raw.SMTP_FROM || raw.SMTP_USER || "no-reply@localhost",
  contactReceiver: raw.CONTACT_RECEIVER_EMAIL || raw.SMTP_USER || "",
} as const;

export type Env = typeof env;
