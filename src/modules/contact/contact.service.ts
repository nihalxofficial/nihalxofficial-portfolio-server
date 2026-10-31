import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { ContactMessageModel } from "../../models";
import { ApiError } from "../../utils/apiError";
import {
  buildPaginationMeta,
  type PaginationMeta,
} from "../../utils/sendResponse";
import type { CreateContactInput } from "./contact.validator";

let transporter: nodemailer.Transporter | null = null;

/**
 * Works with any SMTP provider (Gmail app password, Brevo, Resend, Mailgun,
 * Zoho, Mailtrap...). Port 465 uses implicit TLS, 587/25 start with STARTTLS.
 */
function getTransporter(): nodemailer.Transporter | null {
  if (!env.smtpConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: { user: env.SMTP_USER as string, pass: env.SMTP_PASSWORD as string },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
}

/** Optional boot-time probe so a wrong SMTP password shows up in the logs. */
export async function verifySmtp(): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) return false;
  try {
    await mailer.verify();
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[contact] SMTP verification failed:", (error as Error).message);
    return false;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The message is always persisted first — email delivery is best effort and
 * never causes a visitor to lose their message.
 */
export async function createContactMessage(input: CreateContactInput, userAgent: string) {
  const message = await ContactMessageModel.create({
    name: input.name,
    email: input.email,
    subject: input.subject || "Portfolio inquiry",
    message: input.message,
    location: input.location ?? "",
    userAgent: userAgent.slice(0, 300),
  });

  const mailer = getTransporter();
  if (mailer && env.contactReceiver) {
    try {
      await mailer.sendMail({
        from: `"Portfolio Contact" <${env.emailFrom}>`,
        to: env.contactReceiver,
        replyTo: input.email,
        subject: `${input.name} — ${input.subject || "Portfolio inquiry"}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;background:#050b16;padding:32px;color:#dbeafe">
            <h2 style="margin:0 0 8px;color:#22d3ee">New portfolio message</h2>
            <p style="margin:0 0 20px;color:#93a7c0">${escapeHtml(input.location || "Location unknown")}</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
              <tr><td style="padding:6px 0;color:#93a7c0">Name</td><td style="color:#e8f3ff">${escapeHtml(input.name)}</td></tr>
              <tr><td style="padding:6px 0;color:#93a7c0">Email</td><td style="color:#22d3ee">${escapeHtml(input.email)}</td></tr>
              <tr><td style="padding:6px 0;color:#93a7c0">Subject</td><td style="color:#e8f3ff">${escapeHtml(input.subject || "—")}</td></tr>
            </table>
            <div style="background:#0b1a2c;border-left:3px solid #22d3ee;border-radius:8px;padding:18px">
              <p style="margin:0;white-space:pre-wrap;line-height:1.7">${escapeHtml(input.message)}</p>
            </div>
          </div>
        `,
      });
      message.emailDelivered = true;
      await message.save();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[contact] email delivery failed:", (error as Error).message);
    }
  }

  return message;
}

export async function listContactMessages(params: {
  status?: string;
  search?: string;
  page: number;
  limit: number;
  skip: number;
}): Promise<{ items: unknown[]; meta: PaginationMeta; unreadCount: number }> {
  const filter: Record<string, unknown> = {};

  if (params.status && params.status !== "all") filter.status = params.status;

  if (params.search) {
    const term = new RegExp(params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: term }, { email: term }, { subject: term }, { message: term }];
  }

  const [items, total, unreadCount] = await Promise.all([
    ContactMessageModel.find(filter).sort({ createdAt: -1 }).skip(params.skip).limit(params.limit).lean(),
    ContactMessageModel.countDocuments(filter),
    ContactMessageModel.countDocuments({ status: "unread" }),
  ]);

  return {
    items,
    meta: buildPaginationMeta(params.page, params.limit, total),
    unreadCount,
  };
}

export async function updateContactStatus(id: string, status: string) {
  const updated = await ContactMessageModel.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) throw ApiError.notFound("Message not found");
  return updated;
}

export async function deleteContactMessage(id: string) {
  const deleted = await ContactMessageModel.findByIdAndDelete(id).lean();
  if (!deleted) throw ApiError.notFound("Message not found");
  return deleted;
}
