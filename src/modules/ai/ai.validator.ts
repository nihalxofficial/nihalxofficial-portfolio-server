import { z } from "zod";
import { ENTITY_KEYS } from "./ai.formFill";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1, "Message cannot be empty").max(4000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** Dashboard form autofill: rough notes in, structured form fields out. */
export const formFillRequestSchema = z.object({
  entity: z.enum(ENTITY_KEYS),
  notes: z
    .string()
    .trim()
    .min(8, "Describe what the entry is about in a few words")
    .max(4000),
  current: z.record(z.unknown()).optional(),
  language: z.enum(["english", "bangla"]).optional(),
});

export type FormFillRequest = z.infer<typeof formFillRequestSchema>;
