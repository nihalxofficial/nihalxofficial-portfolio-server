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

/**
 * Primary model first, then the configured fallbacks. Google regularly answers
 * 503 for the newest flash model during demand spikes, and a model that is two
 * weeks older answers just as well for this use case.
 */
export function getModelChain(): string[] {
  const chain = [env.GEMINI_MODEL, ...env.GEMINI_FALLBACK_MODELS.split(",")];
  const unique = chain.map((model) => model.trim()).filter(Boolean);
  return [...new Set(unique)];
}

export const TRANSIENT_AI_ERROR = /503|UNAVAILABLE|429|RESOURCE_EXHAUSTED|overload|high demand/i;

export const isTransientAiError = (error: unknown) =>
  TRANSIENT_AI_ERROR.test((error as Error)?.message ?? "");
