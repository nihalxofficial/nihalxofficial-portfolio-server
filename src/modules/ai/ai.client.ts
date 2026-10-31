import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env";
import { ApiError } from "../../utils/apiError";

/**
 * One Gemini client shared by the public assistant (chat) and the private
 * writing assistant (dashboard form autofill). Both use GEMINI_API_KEY.
 */
let client: GoogleGenAI | null = null;

export function isAssistantConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

export function getClient(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) {
    throw ApiError.serviceUnavailable(
      "The AI assistant is not configured yet. Set GEMINI_API_KEY on the server.",
    );
  }
  if (!client) client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}
