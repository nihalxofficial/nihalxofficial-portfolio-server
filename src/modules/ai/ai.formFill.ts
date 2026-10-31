import { z } from "zod";
import { env } from "../../config/env";
import { ApiError } from "../../utils/apiError";
import { getClient, getModelChain, isAssistantConfigured, isTransientAiError } from "./ai.client";

/**
 * Dashboard-side writing assistant.
 *
 * The admin types rough notes ("built a hotel booking app with next and mongo,
 * stripe payments, admin can block dates"), presses one button, and the AI
 * returns a JSON object whose keys match the form fields of that entity.
 * The dashboard then fills the inputs with the returned values.
 *
 * Same Gemini key as the public assistant — no second provider needed.
 */

type FieldType =
  | "text"
  | "longText"
  | "list"
  | "url"
  | "slug"
  | "number"
  | "boolean"
  | "enum";

interface FieldSpec {
  name: string;
  type: FieldType;
  hint: string;
  required?: boolean;
  options?: readonly string[];
}

interface EntitySpec {
  label: string;
  fields: readonly FieldSpec[];
}

const ENTITY_SPECS = {
  project: {
    label: "portfolio project",
    fields: [
      { name: "title", type: "text", hint: "2-5 words, no marketing fluff", required: true },
      { name: "slug", type: "slug", hint: "kebab-case url id", required: true },
      {
        name: "shortDescription",
        type: "text",
        hint: "one sentence, max 160 characters, used on the card",
        required: true,
      },
      {
        name: "description",
        type: "longText",
        hint: "2-4 short paragraphs separated by blank lines: what it does, who it is for, how it is built",
        required: true,
      },
      {
        name: "category",
        type: "enum",
        hint: "project type",
        options: ["Full-Stack", "Frontend", "Backend", "AI/ML", "Mobile", "Tooling"],
      },
      { name: "techStack", type: "list", hint: "3-6 technologies actually used" },
      { name: "features", type: "list", hint: "3-6 concrete capabilities, no fluff" },
      { name: "challenges", type: "text", hint: "1-2 sentences about the hardest problem solved" },
      { name: "improvements", type: "text", hint: "1-2 sentences about what would be improved next" },
      { name: "liveUrl", type: "url", hint: "deployment url, omit if none" },
      { name: "sourceUrl", type: "url", hint: "repository url, omit if none" },
    ],
  },
  blog: {
    label: "blog article",
    fields: [
      { name: "title", type: "text", hint: "specific, technical headline", required: true },
      { name: "slug", type: "slug", hint: "kebab-case url id", required: true },
      { name: "excerpt", type: "text", hint: "1-2 sentences, max 200 characters" },
      {
        name: "content",
        type: "longText",
        hint: "400-700 words in markdown, use ## headings, short paragraphs, fenced code where useful",
        required: true,
      },
      { name: "category", type: "text", hint: "one word or short phrase, e.g. Engineering" },
      { name: "tags", type: "list", hint: "3-5 lowercase technical tags" },
      { name: "readingTime", type: "text", hint: "e.g. '6 min read'" },
    ],
  },
  experience: {
    label: "work experience entry",
    fields: [
      { name: "organization", type: "text", hint: "company or team name", required: true },
      { name: "role", type: "text", hint: "job title", required: true },
      {
        name: "employmentType",
        type: "enum",
        hint: "contract type",
        options: ["Internship", "Full-time", "Part-time", "Contract", "Freelance", "Training"],
      },
      { name: "location", type: "text", hint: "e.g. Remote, or city, country" },
      { name: "startDate", type: "text", hint: "e.g. 'Jul 2026'", required: true },
      { name: "endDate", type: "text", hint: "'Present' when ongoing, otherwise 'Oct 2026'" },
      { name: "isCurrent", type: "boolean", hint: "true when the role is ongoing" },
      {
        name: "status",
        type: "enum",
        hint: "timeline badge",
        options: ["current", "upcoming", "ongoing", "completed"],
      },
      { name: "description", type: "text", hint: "one sentence summary of the role" },
      {
        name: "responsibilities",
        type: "list",
        hint: "3-5 bullet points starting with a verb, concrete and technical",
      },
      { name: "technologies", type: "list", hint: "stack actually used in the role" },
    ],
  },
  education: {
    label: "education entry",
    fields: [
      { name: "degree", type: "text", hint: "degree name", required: true },
      { name: "institution", type: "text", hint: "school or university", required: true },
      { name: "field", type: "text", hint: "field of study" },
      { name: "period", type: "text", hint: "e.g. '2023 — 2027'" },
      { name: "description", type: "text", hint: "one short sentence" },
      { name: "highlights", type: "list", hint: "2-4 achievements or relevant coursework" },
    ],
  },
  certification: {
    label: "certification",
    fields: [
      { name: "title", type: "text", hint: "certification name", required: true },
      { name: "issuer", type: "text", hint: "organisation that issued it" },
      { name: "year", type: "text", hint: "4-digit year" },
      { name: "credentialUrl", type: "url", hint: "verification link, omit if none" },
    ],
  },
  skill: {
    label: "skill",
    fields: [
      { name: "name", type: "text", hint: "technology name, exact casing", required: true },
      {
        name: "category",
        type: "text",
        hint: "grouping used by the site, e.g. Frontend, Backend, Database, Tools",
        required: true,
      },
      { name: "icon", type: "text", hint: "simple-icons or font-awesome key, e.g. SiReact" },
      { name: "brandColor", type: "text", hint: "hex colour of the brand, e.g. #61DAFB" },
      {
        name: "proficiency",
        type: "enum",
        hint: "honest level",
        options: ["learning", "familiar", "advanced", "expert"],
      },
    ],
  },
  service: {
    label: "service offering",
    fields: [
      { name: "title", type: "text", hint: "3-4 words", required: true },
      { name: "description", type: "text", hint: "2 sentences, what the client gets", required: true },
      { name: "icon", type: "text", hint: "font-awesome class, e.g. fa-solid fa-code" },
    ],
  },
  testimonial: {
    label: "testimonial",
    fields: [
      { name: "name", type: "text", hint: "client name", required: true },
      { name: "role", type: "text", hint: "role and company" },
      { name: "message", type: "text", hint: "2-3 sentences in the client's voice", required: true },
      { name: "rating", type: "number", hint: "1 to 5" },
    ],
  },
  statistic: {
    label: "highlight statistic",
    fields: [
      { name: "value", type: "text", hint: "short figure like '5+' or '100+'", required: true },
      { name: "label", type: "text", hint: "what the figure counts", required: true },
      { name: "description", type: "text", hint: "one clarifying sentence" },
    ],
  },
  hero: {
    label: "hero section",
    fields: [
      { name: "greeting", type: "text", hint: "e.g. \"Hi, I'm\"" },
      { name: "name", type: "text", hint: "full name", required: true },
      { name: "highlightedName", type: "text", hint: "part of the name drawn in accent colour" },
      { name: "role", type: "text", hint: "professional title", required: true },
      {
        name: "description",
        type: "longText",
        hint: "2-3 sentences: what he builds, with what, and the value he delivers",
        required: true,
      },
      { name: "availabilityLabel", type: "text", hint: "e.g. 'Available for remote work'" },
    ],
  },
  about: {
    label: "about section",
    fields: [
      { name: "heading", type: "text", hint: "short heading" },
      { name: "paragraphs", type: "list", hint: "3-4 paragraphs, first person, no clichés" },
      { name: "signature", type: "text", hint: "a short personal motto" },
    ],
  },
  section: {
    label: "section copy",
    fields: [
      { name: "label", type: "text", hint: "mono label shown above the heading, e.g. 'About Me'" },
      { name: "heading", type: "text", hint: "section heading" },
      { name: "description", type: "text", hint: "one supporting sentence" },
    ],
  },
  siteSettings: {
    label: "site settings",
    fields: [
      { name: "siteName", type: "text", hint: "site or brand name" },
      { name: "metaTitle", type: "text", hint: "SEO title, max 60 characters" },
      { name: "metaDescription", type: "text", hint: "SEO description, max 160 characters" },
      { name: "keywords", type: "list", hint: "5-8 lowercase search keywords" },
    ],
  },
} as const satisfies Record<string, EntitySpec>;

export type FormFillEntity = keyof typeof ENTITY_SPECS;
export const ENTITY_KEYS = Object.keys(ENTITY_SPECS) as [FormFillEntity, ...FormFillEntity[]];

export interface FormFillInput {
  entity: FormFillEntity;
  notes: string;
  current?: Record<string, unknown>;
  language?: "english" | "bangla";
}

export interface FormFillResult {
  entity: FormFillEntity;
  fields: Record<string, string | number | boolean | string[]>;
  missingRequired: string[];
  model: string;
}

function buildFieldSchema(field: FieldSpec): z.ZodTypeAny {
  switch (field.type) {
    case "list":
      return z.array(z.string().trim().min(1).max(600)).max(20);
    case "number":
      return z.coerce.number().min(0).max(1000);
    case "boolean":
      return z.boolean();
    case "slug":
      return z.string().trim().max(120);
    case "url":
      return z.string().trim().max(600);
    case "longText":
      return z.string().trim().max(8000);
    case "enum":
      return z.enum(field.options as unknown as [string, ...string[]]);
    default:
      return z.string().trim().max(2000);
  }
}

function schemaFor(fields: readonly FieldSpec[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    // Everything is optional so a partial answer still fills the form; the
    // missing required keys are reported back instead of failing the request.
    shape[field.name] = buildFieldSchema(field).optional();
  }
  return z.object(shape);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) {
      throw ApiError.badGateway("The assistant did not return usable JSON. Try again.");
    }
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw ApiError.badGateway("The assistant returned malformed JSON. Try again.");
    }
  }
}

function buildSystemPrompt(): string {
  return [
    "You are the writing assistant inside the private dashboard of a full-stack developer's portfolio.",
    "You turn rough notes into publish-ready website copy.",
    "",
    "Rules:",
    "- Reply with a single JSON object and nothing else: no markdown fences, no commentary.",
    "- Use only the keys listed in the request. Never add or rename keys.",
    "- Write in first person when it reads naturally, as the developer describing his own work.",
    "- Be specific and technical. Avoid buzzwords like seamless, cutting-edge, passionate, rockstar.",
    "- Preserve every concrete fact the user gives. Never invent employers, dates, metrics or links.",
    "- If a detail is genuinely unknown, omit that key instead of guessing.",
    "- Keep British-friendly plain English, no emoji, no exclamation marks.",
  ].join("\n");
}

function buildUserPrompt(input: FormFillInput, spec: EntitySpec): string {
  const fieldLines = spec.fields.map((field) => {
    const typeLabel = field.options ? `enum(${field.options.join(" | ")})` : field.type;
    const required = field.required ? ", required" : "";
    return `- "${field.name}" (${typeLabel}${required}): ${field.hint}`;
  });

  const current =
    input.current && Object.keys(input.current).length > 0
      ? `Existing form values, improve or keep them, do not wipe good content:\n${JSON.stringify(
          input.current,
          null,
          2,
        )}`
      : "The form is empty.";

  const language =
    input.language === "bangla"
      ? "Write the copy in Bangla."
      : "Write the copy in English.";

  return [
    `Target: ${spec.label}.`,
    `Language: ${language}`,
    "",
    "Fields to return:",
    ...fieldLines,
    "",
    current,
    "",
    "Rough notes from the developer:",
    input.notes.trim(),
    "",
    "Return the filled JSON object now.",
  ].join("\n");
}

/**
 * Generates form content for one entity. Retries once when the model answers
 * with something that is not valid JSON.
 */
export async function generateFormDraft(input: FormFillInput): Promise<FormFillResult> {
  if (!isAssistantConfigured()) {
    throw ApiError.serviceUnavailable("Set GEMINI_API_KEY on the server to use the writing assistant.");
  }

  const spec = ENTITY_SPECS[input.entity];
  const fieldSpecs = spec.fields as readonly FieldSpec[];
  const schema = schemaFor(fieldSpecs);

  let lastError: unknown = null;

  // Same model chain as the public assistant: an overloaded primary model is
  // replaced by the next one instead of failing the whole request.
  for (const model of getModelChain()) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await getClient().models.generateContent({
          model,
          contents: buildUserPrompt(input, spec),
          config: {
            systemInstruction: buildSystemPrompt(),
            responseMimeType: "application/json",
            temperature: attempt === 0 ? 0.7 : 0.3,
            topP: 0.95,
            maxOutputTokens: 2800,
          },
        });

        const text = response.text;
        if (!text) throw ApiError.badGateway("The assistant returned an empty response. Try again.");

        const parsed = schema.parse(extractJson(text)) as Record<string, unknown>;

        const fields: FormFillResult["fields"] = {};
        for (const field of fieldSpecs) {
          const value = parsed[field.name];
          if (value === undefined || value === null) continue;
          if (typeof value === "string") {
            const trimmed = value.trim();
            if (trimmed) fields[field.name] = trimmed;
          } else if (Array.isArray(value)) {
            const list = value.map((item) => String(item).trim()).filter(Boolean);
            if (list.length) fields[field.name] = list;
          } else if (typeof value === "number" || typeof value === "boolean") {
            fields[field.name] = value;
          }
        }

        // A missing slug blocks publishing, so derive it from the title.
        if ("slug" in fields || fieldSpecs.some((field) => field.name === "slug")) {
          const slug = typeof fields.slug === "string" ? fields.slug.trim() : "";
          const fromTitle = slugify(String(fields.title ?? fields.name ?? ""));
          const resolved = slug || fromTitle;
          if (resolved) fields.slug = resolved;
          else delete fields.slug;
        }

        const missingRequired = fieldSpecs
          .filter((field) => field.required && fields[field.name] === undefined)
          .map((field) => field.name);

        return { entity: input.entity, fields, missingRequired, model };
      } catch (error) {
        lastError = error;
        // An overloaded model is skipped, a malformed answer is retried once.
        if (isTransientAiError(error)) break;
      }
    }
  }

  // eslint-disable-next-line no-console
  console.error("[ai] form fill failed:", (lastError as Error)?.message);
  if (lastError instanceof ApiError) throw lastError;
  throw ApiError.badGateway("The writing assistant could not fill this form. Try again.");
}
