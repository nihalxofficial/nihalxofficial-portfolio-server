import type { Model } from "mongoose";
import { z } from "zod";
import {
  AboutModel,
  BlogPostModel,
  CertificationModel,
  EducationModel,
  ExperienceModel,
  HeroModel,
  NavigationModel,
  ProjectModel,
  SectionModel,
  ServiceModel,
  SiteSettingsModel,
  SkillModel,
  StatisticModel,
  TestimonialModel,
} from "../../models";

/**
 * Single source of truth for the dashboard.
 *
 * Every content type is described once: which model it uses, which fields the
 * dashboard may write, and how each field is validated. The CRUD endpoints and
 * the derived zod schemas are generated from this registry, so a new field or
 * entity only ever needs to be added here.
 */

export type FieldKind =
  | "string"
  | "text"
  | "slug"
  | "url"
  | "list"
  | "boolean"
  | "number"
  | "enum"
  | "date"
  | "object"
  | "objectList";

export interface FieldDef {
  name: string;
  kind: FieldKind;
  required?: boolean;
  options?: readonly string[];
  children?: readonly FieldDef[];
  max?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = Model<any>;

export interface EntityDef {
  key: string;
  label: string;
  model: AnyModel;
  /** One document only (hero, about, settings): PUT upserts instead of POST. */
  singleton?: boolean;
  fields: readonly FieldDef[];
  sort: Record<string, 1 | -1>;
  search: readonly string[];
  /** Field used for human readable labels in lists and delete confirmations. */
  titleField: string;
}

const ordered: FieldDef[] = [
  { name: "order", kind: "number" },
  { name: "isVisible", kind: "boolean" },
];

const seoFields: FieldDef = {
  name: "seo",
  kind: "object",
  children: [
    { name: "title", kind: "string" },
    { name: "description", kind: "text" },
  ],
};

const linkFields = (prefix: string): FieldDef => ({
  name: prefix,
  kind: "object",
  children: [
    { name: "label", kind: "string" },
    { name: "href", kind: "string" },
  ],
});

const ENTITIES: EntityDef[] = [
  {
    key: "projects",
    label: "Projects",
    model: ProjectModel,
    titleField: "title",
    sort: { order: 1, createdAt: -1 },
    search: ["title", "slug", "category"],
    fields: [
      { name: "title", kind: "string", required: true, max: 160 },
      { name: "slug", kind: "slug", required: true },
      { name: "shortDescription", kind: "string", required: true, max: 300 },
      { name: "description", kind: "text" },
      { name: "thumbnailUrl", kind: "url" },
      { name: "screenshots", kind: "list" },
      { name: "category", kind: "string", max: 60 },
      { name: "techStack", kind: "list" },
      { name: "features", kind: "list" },
      { name: "challenges", kind: "text" },
      { name: "improvements", kind: "text" },
      { name: "liveUrl", kind: "url" },
      { name: "sourceUrl", kind: "url" },
      { name: "isFeatured", kind: "boolean" },
      { name: "isPublished", kind: "boolean" },
      seoFields,
      ...ordered,
    ],
  },
  {
    key: "posts",
    label: "Blog posts",
    model: BlogPostModel,
    titleField: "title",
    sort: { publishedAt: -1, createdAt: -1 },
    search: ["title", "slug", "category"],
    fields: [
      { name: "title", kind: "string", required: true, max: 180 },
      { name: "slug", kind: "slug", required: true },
      { name: "excerpt", kind: "text" },
      { name: "content", kind: "text" },
      { name: "coverImageUrl", kind: "url" },
      { name: "tags", kind: "list" },
      { name: "category", kind: "string", max: 60 },
      { name: "readingTime", kind: "string", max: 40 },
      { name: "isPublished", kind: "boolean" },
      { name: "publishedAt", kind: "date" },
      seoFields,
    ],
  },
  {
    key: "experience",
    label: "Experience",
    model: ExperienceModel,
    titleField: "role",
    sort: { order: 1 },
    search: ["organization", "role"],
    fields: [
      { name: "organization", kind: "string", required: true },
      { name: "role", kind: "string", required: true },
      { name: "employmentType", kind: "string", max: 40 },
      { name: "location", kind: "string", max: 120 },
      { name: "startDate", kind: "string", required: true, max: 40 },
      { name: "endDate", kind: "string", max: 40 },
      { name: "isCurrent", kind: "boolean" },
      {
        name: "status",
        kind: "enum",
        options: ["current", "upcoming", "ongoing", "completed"],
      },
      { name: "description", kind: "text" },
      { name: "responsibilities", kind: "list" },
      { name: "technologies", kind: "list" },
      ...ordered,
    ],
  },
  {
    key: "education",
    label: "Education",
    model: EducationModel,
    titleField: "degree",
    sort: { order: 1 },
    search: ["degree", "institution"],
    fields: [
      { name: "degree", kind: "string", required: true },
      { name: "institution", kind: "string", required: true },
      { name: "field", kind: "string", max: 120 },
      { name: "period", kind: "string", max: 60 },
      { name: "description", kind: "text" },
      { name: "highlights", kind: "list" },
      { name: "icon", kind: "string", max: 60 },
      ...ordered,
    ],
  },
  {
    key: "certifications",
    label: "Certifications",
    model: CertificationModel,
    titleField: "title",
    sort: { order: 1 },
    search: ["title", "issuer"],
    fields: [
      { name: "title", kind: "string", required: true },
      { name: "issuer", kind: "string", max: 160 },
      { name: "year", kind: "string", max: 10 },
      { name: "credentialUrl", kind: "url" },
      { name: "icon", kind: "string", max: 60 },
      { name: "accentColor", kind: "string", max: 30 },
      ...ordered,
    ],
  },
  {
    key: "skills",
    label: "Skills",
    model: SkillModel,
    titleField: "name",
    sort: { category: 1, order: 1 },
    search: ["name", "category"],
    fields: [
      { name: "name", kind: "string", required: true, max: 80 },
      { name: "category", kind: "string", required: true, max: 60 },
      { name: "icon", kind: "string", max: 60 },
      { name: "brandColor", kind: "string", max: 30 },
      {
        name: "proficiency",
        kind: "enum",
        options: ["learning", "familiar", "advanced", "expert"],
      },
      ...ordered,
    ],
  },
  {
    key: "services",
    label: "Services",
    model: ServiceModel,
    titleField: "title",
    sort: { order: 1 },
    search: ["title"],
    fields: [
      { name: "title", kind: "string", required: true },
      { name: "description", kind: "text", required: true },
      { name: "icon", kind: "string", max: 60 },
      ...ordered,
    ],
  },
  {
    key: "testimonials",
    label: "Testimonials",
    model: TestimonialModel,
    titleField: "name",
    sort: { order: 1 },
    search: ["name", "role"],
    fields: [
      { name: "name", kind: "string", required: true },
      { name: "role", kind: "string", max: 160 },
      { name: "message", kind: "text", required: true },
      { name: "rating", kind: "number" },
      { name: "avatarUrl", kind: "url" },
      ...ordered,
    ],
  },
  {
    key: "statistics",
    label: "Statistics",
    model: StatisticModel,
    titleField: "label",
    sort: { order: 1 },
    search: ["label", "value"],
    fields: [
      { name: "value", kind: "string", required: true, max: 20 },
      { name: "label", kind: "string", required: true },
      { name: "description", kind: "string", max: 200 },
      { name: "icon", kind: "string", max: 60 },
      ...ordered,
    ],
  },
  {
    key: "navigation",
    label: "Navigation",
    model: NavigationModel,
    titleField: "label",
    sort: { order: 1 },
    search: ["label", "href"],
    fields: [
      { name: "label", kind: "string", required: true, max: 40 },
      { name: "href", kind: "string", required: true, max: 200 },
      ...ordered,
    ],
  },
  {
    key: "sections",
    label: "Sections",
    model: SectionModel,
    titleField: "key",
    sort: { order: 1 },
    search: ["key", "label"],
    fields: [
      { name: "key", kind: "slug", required: true },
      { name: "label", kind: "string", max: 80 },
      { name: "heading", kind: "string", max: 160 },
      { name: "description", kind: "text" },
      { name: "order", kind: "number" },
      { name: "isVisible", kind: "boolean" },
    ],
  },
  {
    key: "hero",
    label: "Hero section",
    model: HeroModel,
    singleton: true,
    titleField: "name",
    sort: { order: 1 },
    search: ["name", "role"],
    fields: [
      { name: "greeting", kind: "string", max: 60 },
      { name: "name", kind: "string", required: true, max: 120 },
      { name: "highlightedName", kind: "string", max: 120 },
      { name: "role", kind: "string", required: true, max: 160 },
      { name: "description", kind: "text", required: true },
      {
        name: "availability",
        kind: "object",
        children: [
          { name: "label", kind: "string" },
          { name: "isAvailable", kind: "boolean" },
        ],
      },
      linkFields("primaryCta"),
      linkFields("secondaryCta"),
      {
        name: "terminal",
        kind: "object",
        children: [
          { name: "command", kind: "string" },
          { name: "lines", kind: "list" },
        ],
      },
      { name: "portraitUrl", kind: "url" },
      ...ordered,
    ],
  },
  {
    key: "about",
    label: "About section",
    model: AboutModel,
    singleton: true,
    titleField: "heading",
    sort: { order: 1 },
    search: ["heading", "label"],
    fields: [
      { name: "label", kind: "string", max: 80 },
      { name: "heading", kind: "string", max: 160 },
      { name: "paragraphs", kind: "list" },
      { name: "portraitUrl", kind: "url" },
      {
        name: "codeCard",
        kind: "object",
        children: [
          { name: "name", kind: "string" },
          { name: "role", kind: "string" },
          { name: "location", kind: "string" },
          { name: "education", kind: "string" },
          { name: "experience", kind: "string" },
          { name: "passion", kind: "list" },
        ],
      },
      {
        name: "highlights",
        kind: "objectList",
        children: [
          { name: "icon", kind: "string" },
          { name: "label", kind: "string" },
          { name: "value", kind: "string" },
        ],
      },
      { name: "signature", kind: "string", max: 160 },
      ...ordered,
    ],
  },
  {
    key: "settings",
    label: "Site settings",
    model: SiteSettingsModel,
    singleton: true,
    titleField: "siteName",
    sort: { order: 1 },
    search: ["siteName", "metaTitle"],
    fields: [
      { name: "siteName", kind: "string", max: 120 },
      { name: "siteUrl", kind: "url" },
      { name: "metaTitle", kind: "string", max: 120 },
      { name: "metaDescription", kind: "text" },
      { name: "keywords", kind: "list" },
      { name: "ogImageUrl", kind: "url" },
      {
        name: "branding",
        kind: "object",
        children: [
          { name: "navLogoLight", kind: "url" },
          { name: "navLogoDark", kind: "url" },
          { name: "footerLogoLight", kind: "url" },
          { name: "footerLogoDark", kind: "url" },
          { name: "faviconUrl", kind: "url" },
          { name: "logoAlt", kind: "string", max: 120 },
        ],
      },
      {
        name: "contact",
        kind: "object",
        children: [
          { name: "email", kind: "string" },
          { name: "phone", kind: "string" },
          { name: "location", kind: "string" },
          { name: "availability", kind: "string" },
        ],
      },
      {
        name: "socialLinks",
        kind: "objectList",
        children: [
          { name: "platform", kind: "string" },
          { name: "url", kind: "string" },
          { name: "icon", kind: "string" },
        ],
      },
      { name: "resumeUrl", kind: "url" },
    ],
  },
];

export const ENTITY_MAP = new Map(ENTITIES.map((entity) => [entity.key, entity]));
export const ENTITY_KEYS = ENTITIES.map((entity) => entity.key);
export const ENTITY_SUMMARY = ENTITIES.map((entity) => ({
  key: entity.key,
  label: entity.label,
  singleton: Boolean(entity.singleton),
  fields: entity.fields,
  titleField: entity.titleField,
}));

export function getEntity(key: string): EntityDef | undefined {
  return ENTITY_MAP.get(key);
}

// ─── Validation ──────────────────────────────────────────────────────────────

function buildFieldSchema(field: FieldDef): z.ZodTypeAny {
  switch (field.kind) {
    case "slug":
      return z
        .string()
        .trim()
        .max(120)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes");
    case "url":
      return z.string().trim().max(800);
    case "list":
      return z.array(z.string().trim().max(800)).max(40);
    case "boolean":
      return z.boolean();
    case "number":
      return z.coerce.number().min(-99999).max(99999);
    case "enum":
      return z.enum(field.options as unknown as [string, ...string[]]);
    case "date":
      // An empty date input must clear the value instead of failing coercion.
      return z.preprocess(
        (value) => (value === "" || value === null ? undefined : value),
        z.coerce.date().optional(),
      );
    case "object": {
      const shape: Record<string, z.ZodTypeAny> = {};
      for (const child of field.children ?? []) shape[child.name] = buildFieldSchema(child).optional();
      return z.object(shape);
    }
    case "objectList": {
      const shape: Record<string, z.ZodTypeAny> = {};
      for (const child of field.children ?? []) shape[child.name] = buildFieldSchema(child).optional();
      return z.array(z.object(shape)).max(25);
    }
    case "text":
      return z.string().trim().max(field.max ?? 20000);
    default:
      return z.string().trim().max(field.max ?? 2000);
  }
}

function buildSchema(entity: EntityDef, mode: "create" | "update") {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of entity.fields) {
    const base = buildFieldSchema(field);
    shape[field.name] =
      mode === "create" && field.required ? base : base.optional();
  }
  // Ignore unknown keys instead of rejecting them: the dashboard may send
  // read-only view state along with the payload.
  return z.object(shape);
}

export function createSchemaFor(entity: EntityDef) {
  return buildSchema(entity, "create");
}

export function updateSchemaFor(entity: EntityDef) {
  return buildSchema(entity, "update");
}

// ─── Write protection ────────────────────────────────────────────────────────

/** Keeps only registry fields, recursively. Nothing else can reach the model. */
export function pickFields(
  fields: readonly FieldDef[],
  input: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const field of fields) {
    if (!(field.name in input)) continue;
    const value = input[field.name];
    if (value === undefined) continue;

    if (field.kind === "object" && field.children) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        const nested = pickFields(field.children, value as Record<string, unknown>);
        if (Object.keys(nested).length > 0) output[field.name] = nested;
      }
      continue;
    }

    if (field.kind === "objectList" && field.children) {
      if (Array.isArray(value)) {
        output[field.name] = value.map((row) =>
          pickFields(field.children!, (row ?? {}) as Record<string, unknown>),
        );
      }
      continue;
    }

    output[field.name] = value;
  }

  return output;
}
