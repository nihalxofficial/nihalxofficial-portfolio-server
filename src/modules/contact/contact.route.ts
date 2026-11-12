import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate";
import {
  getMessage,
  getMessages,
  patchMessageStatus,
  removeMessage,
  replyToMessage,
  submitContact,
} from "./contact.controller";
import {
  contactQuerySchema,
  createContactSchema,
  replyContactSchema,
  updateContactSchema,
} from "./contact.validator";

// Public — mounted under /api/v1/contact
export const contactPublicRouter = Router();
contactPublicRouter.post("/", validate({ body: createContactSchema }), submitContact);

// Admin — mounted under /api/v1/admin/messages
export const contactAdminRouter = Router();
contactAdminRouter.use(requireAuth, requireRole("admin"));
contactAdminRouter.get("/", validate({ query: contactQuerySchema }), getMessages);
contactAdminRouter.get("/:id", getMessage);
contactAdminRouter.post("/:id/reply", validate({ body: replyContactSchema }), replyToMessage);
contactAdminRouter.patch("/:id", validate({ body: updateContactSchema }), patchMessageStatus);
contactAdminRouter.delete("/:id", removeMessage);
