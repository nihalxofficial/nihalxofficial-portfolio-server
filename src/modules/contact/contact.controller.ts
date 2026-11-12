import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import {
  createContactMessage,
  deleteContactMessage,
  getContactMessage,
  listContactMessages,
  replyToContactMessage,
  updateContactStatus,
} from "./contact.service";
import type { ContactListQuery } from "./contact.validator";

export const submitContact = catchAsync(async (req, res) => {
  const message = await createContactMessage(req.body, req.headers["user-agent"] ?? "");

  return sendResponse(res, 201, {
    message: "Thanks for reaching out. Your message has been received.",
    data: { id: message._id, createdAt: message.createdAt },
  });
});

export const getMessages = catchAsync(async (req, res) => {
  const query = req.query as unknown as ContactListQuery;
  const page = query.page ?? 1;
  const limit = Math.min(100, query.limit ?? 20);

  const { items, meta, unreadCount } = await listContactMessages({
    status: query.status,
    search: query.search,
    sort: query.sort,
    dir: query.dir,
    delivery: query.delivery,
    from: query.from,
    to: query.to,
    page,
    limit,
    skip: (page - 1) * limit,
  });

  res.setHeader("X-Unread-Count", String(unreadCount));

  return sendResponse(res, 200, {
    message: "Messages retrieved",
    data: items,
    meta: { ...meta, unreadCount },
  });
});

export const getMessage = catchAsync(async (req, res) => {
  const message = await getContactMessage(String(req.params.id));

  return sendResponse(res, 200, { message: "Message retrieved", data: message });
});

export const replyToMessage = catchAsync(async (req, res) => {
  const message = await replyToContactMessage(String(req.params.id), {
    ...req.body,
    ccOwner: req.body.ccOwner !== false,
  });

  return sendResponse(res, 200, {
    message: "Reply sent",
    data: { replies: message.replies, status: message.status },
  });
});

export const patchMessageStatus = catchAsync(async (req, res) => {
  const updated = await updateContactStatus(String(req.params.id), req.body.status);

  return sendResponse(res, 200, { message: "Message updated", data: updated });
});

export const removeMessage = catchAsync(async (req, res) => {
  await deleteContactMessage(String(req.params.id));

  return sendResponse(res, 200, { message: "Message deleted" });
});
