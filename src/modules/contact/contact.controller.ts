import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import {
  createContactMessage,
  deleteContactMessage,
  listContactMessages,
  updateContactStatus,
} from "./contact.service";

export const submitContact = catchAsync(async (req, res) => {
  const message = await createContactMessage(req.body, req.headers["user-agent"] ?? "");

  return sendResponse(res, 201, {
    message: "Thanks for reaching out. Your message has been received.",
    data: { id: message._id, createdAt: message.createdAt },
  });
});

export const getMessages = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(100, Number(req.query.limit) || 20);

  const { items, meta, unreadCount } = await listContactMessages({
    status: req.query.status as string | undefined,
    search: req.query.search as string | undefined,
    page,
    limit,
    skip: (page - 1) * limit,
  });

  res.setHeader("X-Unread-Count", String(unreadCount));

  return sendResponse(res, 200, {
    message: "Messages retrieved",
    data: items,
    meta,
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
