import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { env } from "../../config/env";
import { ContactMessageModel, SiteSettingsModel } from "../../models";
import { ApiError } from "../../utils/apiError";
import {
  buildPaginationMeta,
  type PaginationMeta,
} from "../../utils/sendResponse";
import { newMessageEmail, replyEmail } from "./email.template";
import type { ContactReplyInput, CreateContactInput } from "./contact.validator";

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

function assertObjectId(id: string) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest("Invalid message id");
}

/** Brand copy used in the transactional emails — always read from settings. */
async function emailBrand() {
  const settings = await SiteSettingsModel.findOne().lean();
  return {
    brand: settings?.branding?.wordmark || settings?.siteName || "portfolio",
    siteName: settings?.siteName || "",
    siteUrl: settings?.siteUrl || "",
  };
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
    const brand = await emailBrand();
    const mail = newMessageEmail({
      name: input.name,
      email: input.email,
      subject: input.subject || "Portfolio inquiry",
      message: input.message,
      location: input.location,
      receivedAt: message.createdAt?.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      dashboardUrl: brand.siteUrl ? `${brand.siteUrl.replace(/\/$/, "")}/control-centre/messages` : "",
      brand: brand.brand,
    });

    try {
      await mailer.sendMail({
        from: `"Portfolio Contact" <${env.emailFrom}>`,
        to: env.contactReceiver,
        replyTo: input.email,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
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

/** Column key → field + default direction, so the table can sort either way. */
const SORT_MAP: Record<string, { field: string; dir: "asc" | "desc" }> = {
  newest: { field: "createdAt", dir: "desc" },
  oldest: { field: "createdAt", dir: "asc" },
  name: { field: "name", dir: "asc" },
  email: { field: "email", dir: "asc" },
  subject: { field: "subject", dir: "asc" },
  status: { field: "status", dir: "asc" },
  updated: { field: "updatedAt", dir: "desc" },
};

export interface ListMessagesParams {
  status?: string;
  search?: string;
  sort?: string;
  dir?: string;
  from?: Date;
  to?: Date;
  delivery?: string;
  page: number;
  limit: number;
  skip: number;
}

export async function listContactMessages(params: ListMessagesParams): Promise<{
  items: unknown[];
  meta: PaginationMeta;
  unreadCount: number;
}> {
  const filter: Record<string, unknown> = {};

  if (params.status && params.status !== "all") filter.status = params.status;

  if (params.delivery === "failed") filter.emailDelivered = false;
  if (params.delivery === "delivered") filter.emailDelivered = true;

  if (params.from || params.to) {
    const range: Record<string, Date> = {};
    if (params.from) range.$gte = params.from;
    if (params.to) range.$lte = params.to;
    filter.createdAt = range;
  }

  if (params.search) {
    const term = new RegExp(params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: term }, { email: term }, { subject: term }, { message: term }];
  }

  const column = SORT_MAP[params.sort ?? ""] ?? SORT_MAP.newest;
  const ascending = params.dir
    ? params.dir === "asc"
    : column.dir === "asc";
  const sort: Record<string, 1 | -1> = { [column.field]: ascending ? 1 : -1 };
  const alphabetical = ["name", "email", "subject"].includes(column.field);

  const query = ContactMessageModel.find(filter)
    // The list is a table: the browser agent is only shown in the detail view.
    .select("-userAgent")
    .sort(sort)
    .skip(params.skip)
    .limit(params.limit);

  if (alphabetical) query.collation({ locale: "en", strength: 2 });

  const [items, total, unreadCount] = await Promise.all([
    query.lean(),
    ContactMessageModel.countDocuments(filter),
    ContactMessageModel.countDocuments({ status: "unread" }),
  ]);

  return {
    items,
    meta: buildPaginationMeta(params.page, params.limit, total),
    unreadCount,
  };
}

/** Opening a message from the table also clears its unread badge. */
export async function getContactMessage(id: string) {
  assertObjectId(id);

  const current = await ContactMessageModel.findById(id).lean();
  if (!current) throw ApiError.notFound("Message not found");

  if (current.status !== "unread") return current;

  return (
    (await ContactMessageModel.findByIdAndUpdate(id, { status: "read" }, { new: true }).lean()) ??
    current
  );
}

export async function updateContactStatus(id: string, status: string) {
  assertObjectId(id);

  const updated = await ContactMessageModel.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) throw ApiError.notFound("Message not found");
  return updated;
}

export async function deleteContactMessage(id: string) {
  assertObjectId(id);

  const deleted = await ContactMessageModel.findByIdAndDelete(id).lean();
  if (!deleted) throw ApiError.notFound("Message not found");
  return deleted;
}

/**
 * Answers a visitor from the dashboard inbox.
 *
 * The reply is only stored once the provider accepted it, so a failed send
 * leaves the message untouched and the admin can retry.
 */
export async function replyToContactMessage(id: string, input: ContactReplyInput) {
  assertObjectId(id);

  const mailer = getTransporter();
  if (!mailer) {
    throw ApiError.serviceUnavailable(
      "Email delivery is not configured — set SMTP_HOST, SMTP_USER and SMTP_PASSWORD on the server first.",
    );
  }

  const message = await ContactMessageModel.findById(id);
  if (!message) throw ApiError.notFound("Message not found");

  const brand = await emailBrand();
  const mail = replyEmail({
    to: input.to,
    name: message.name,
    subject: input.subject,
    body: input.body,
    originalMessage: message.message,
    siteName: brand.siteName,
    siteUrl: brand.siteUrl,
    brand: brand.brand,
  });

  const cc = input.ccOwner && env.contactReceiver && env.contactReceiver !== input.to
    ? env.contactReceiver
    : undefined;

  try {
    await mailer.sendMail({
      from: `"${brand.siteName || "Portfolio"}" <${env.emailFrom}>`,
      to: input.to,
      ...(cc ? { cc } : {}),
      replyTo: env.contactReceiver || env.emailFrom,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
  } catch (error) {
    throw ApiError.badGateway(`The mail provider rejected this reply: ${(error as Error).message}`);
  }

  message.replies.push({
    to: input.to,
    subject: input.subject,
    body: input.body,
    delivered: true,
  });
  message.status = "replied";
  await message.save();

  return message.toObject();
}

