import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { ApiError } from "../../utils/apiError";
import { sendResponse } from "../../utils/sendResponse";
import { isAssistantConfigured, streamAssistantReply } from "./ai.service";
import { generateFormDraft } from "./ai.formFill";
import type { ChatRequest, FormFillRequest } from "./ai.validator";

/**
 * Server-Sent Events stream so the visitor sees the answer being written
 * instead of staring at a spinner.
 */
export const chat = catchAsync(async (req: Request, res: Response) => {
  if (!isAssistantConfigured()) {
    throw ApiError.serviceUnavailable(
      "The AI assistant is not configured yet. Add GEMINI_API_KEY to the server environment.",
    );
  }

  const { messages } = req.body as ChatRequest;

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  const send = (payload: unknown) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

  // Listen on the response, not the request: in Express 5 the request stream
  // closes as soon as the body has been read, which would abort every stream.
  let aborted = false;
  res.on("close", () => {
    aborted = true;
  });

  try {
    send({ type: "start" });

    await streamAssistantReply(messages, (text) => {
      if (!aborted) send({ type: "delta", text });
    });

    if (!aborted) send({ type: "done" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[ai] chat failed:", (error as Error)?.message ?? error);
    const overloaded = /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED|high demand/i.test(
      (error as Error)?.message ?? "",
    );
    const message = error instanceof ApiError
      ? error.message
      : overloaded
        ? "The assistant is briefly busy, please ask again in a moment."
        : "The assistant is unavailable right now.";
    if (!aborted) send({ type: "error", message });
  } finally {
    if (!res.writableEnded) res.end();
  }
});

/**
 * Dashboard form autofill. Admin-only: the middleware chain in ai.route.ts
 * runs requireAdmin before this handler, so Gemini quota is never public.
 */
export const formFill = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as FormFillRequest;
  const result = await generateFormDraft(payload);

  return sendResponse(res, 200, {
    message: result.missingRequired.length
      ? "Draft generated, a few required fields still need your input"
      : "Draft generated",
    data: result,
  });
});
