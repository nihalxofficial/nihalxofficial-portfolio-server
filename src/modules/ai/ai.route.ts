import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { requireAdmin } from "../../middlewares/auth";
import { assistLimiter, chatLimiter } from "../../middlewares/rateLimit";
import { chat, formFill } from "./ai.controller";
import { chatRequestSchema, formFillRequestSchema } from "./ai.validator";

// Public: visitor-facing assistant that answers questions about Nihal.
const router = Router();
router.post("/chat", chatLimiter, validate({ body: chatRequestSchema }), chat);

export const aiRouter = router;

// Private: writing assistant used inside the dashboard forms.
const adminRouter = Router();
adminRouter.use(requireAdmin);
adminRouter.post(
  "/form-fill",
  assistLimiter,
  validate({ body: formFillRequestSchema }),
  formFill,
);

export const aiAdminRouter = adminRouter;
