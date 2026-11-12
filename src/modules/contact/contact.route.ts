import { Router } from "express";
import { requireAdmin } from "../../middlewares/auth";
import {
  createContactMessage,
  deleteContactMessage,
  listContactMessages,
  readContactMessage,
  updateContactMessage,
} from "./contact.controller";

export const contactRouter = Router();
contactRouter.use(requireAdmin);

contactRouter.get("/", listContactMessages);
contactRouter.post("/", createContactMessage);
contactRouter.patch("/:id", updateContactMessage);
contactRouter.get("/:id", readContactMessage);
contactRouter.delete("/:id", deleteContactMessage);