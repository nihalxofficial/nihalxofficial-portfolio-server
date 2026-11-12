import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createContactMessage,
  deleteContactMessage,
  listContactMessages,
  readContactMessage,
  updateContactMessage,
} from "./contact.controller";

export const contactRouter = Router();
contactRouter.use(requireAuth, requireRole("admin"));

contactRouter.get("/", listContactMessages);
contactRouter.post("/", createContactMessage);
contactRouter.patch("/:id", updateContactMessage);
contactRouter.get("/:id", readContactMessage);
contactRouter.delete("/:id", deleteContactMessage);