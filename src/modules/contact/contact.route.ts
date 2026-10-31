import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { contactLimiter } from "../../middlewares/rateLimit";
import {
  getMessages,
  patchMessageStatus,
  removeMessage,
  submitContact,
} from "./contact.controller";
import {
  contactQuerySchema,
  createContactSchema,
  updateContactSchema,
} from "./contact.validator";

// Public — mounted under /api/v1/contact
export const contactPublicRouter = Router();
contactPublicRouter.post("/", contactLimiter, validate({ body: createContactSchema }), submitContact);

// Admin — mounted under /api/v1/admin/messages
export const contactAdminRouter = Router();
contactAdminRouter.use(requireAdmin);
contactAdminRouter.get("/", validate({ query: contactQuerySchema }), getMessages);
contactAdminRouter.patch("/:id", validate({ body: updateContactSchema }), patchMessageStatus);
contactAdminRouter.delete("/:id", removeMessage);
