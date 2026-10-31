import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

/**
 * Every environment variable the server needs is declared and validated here.
 * The process refuses to boot with a broken configuration instead of failing
 * later, in the middle of a request.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  // Overrides the database name inside the URI (the URI often omits it).
  MONGODB_DATABASE: z.string().default("portfolio"),

  ADMIN_UIDS: z.string().default(""),

  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  // Any SMTP provider: Gmail + app password, Brevo, Resend, Mailgun, Zoho...
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  CONTACT_RECEIVER_EMAIL: z.string().optional(),

  // Image hosting for the dashboard media library.
  IMGBB_API_KEY: z.string().optional(),
  // Optional auto-expiry in seconds (60 .. 15552000). Empty means permanent.
  IMGBB_EXPIRATION: z.coerce.number().int().min(60).max(15_552_000).optional(),
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
  adminUids: raw.ADMIN_UIDS.split(",")
    .map((uid) => uid.trim())
    .filter(Boolean),
  firebasePrivateKey: raw.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  corsOrigins: raw.FRONTEND_URL.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  smtpConfigured: Boolean(raw.SMTP_HOST && raw.SMTP_USER && raw.SMTP_PASSWORD),
  emailFrom: raw.SMTP_FROM || raw.SMTP_USER || "no-reply@localhost",
  contactReceiver: raw.CONTACT_RECEIVER_EMAIL || raw.SMTP_USER || "",
} as const;

export type Env = typeof env;
