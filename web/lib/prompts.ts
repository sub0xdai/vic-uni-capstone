import { invariant } from "./assert.ts";
import {
  BRAND_TONE_LABELS,
  CONTENT_TYPES,
  SOCIAL_CAPTION_MAX,
  err,
  ok,
  type BrandTone,
  type BusinessProfile,
  type ContentType,
  type Result,
} from "./types.ts";

export type PromptInput = {
  contentType: ContentType;
  topic: string;
  keywords: string[];
  profile: BusinessProfile;
};

export type PromptTemplate = {
  contentType: ContentType;
  version: number;
  body: string;
};

export const BUILTIN_PROMPT_VERSION = 1;

const TONE_GUIDE: Record<BrandTone, string> = {
  professional: "clear, polished and confident, with no slang",
  casual: "relaxed and conversational, like talking to a neighbour",
  friendly: "warm, welcoming and upbeat",
};

export const FORMAT_RULES: Record<ContentType, string> = {
  social_caption: [
    "Write one social media caption.",
    `Keep it under ${SOCIAL_CAPTION_MAX} characters.`,
    "Start with a short hook, state the message, end with a clear call to action,",
    "and add 2 to 4 relevant hashtags.",
  ].join(" "),
  email_newsletter: [
    "Write an email newsletter.",
    "Include a subject line that starts with 'Subject:',",
    "a line of preview text that starts with 'Preview:',",
    "a body of two short paragraphs with a greeting and a sign-off,",
    "and button text that starts with 'Button:'.",
    "Keep it under 200 words.",
  ].join(" "),
  blog_outline: [
    "Write a blog post outline.",
    "Include a title, a one line introduction,",
    "three to five sections that each have a heading and one short line saying what it covers,",
    "and a conclusion.",
  ].join(" "),
};

export const STRUCTURE_HINTS: Record<ContentType, readonly string[]> = {
  blog_outline: ["introduction", "heading", "conclusion"],
  social_caption: [String(SOCIAL_CAPTION_MAX), "call to action"],
  email_newsletter: ["Subject:", "Preview:", "Button:"],
};

function blank(value: string): boolean {
  return value.trim().length === 0;
}

export function parsePromptTemplate(value: unknown): Result<PromptTemplate> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return err("prompt_template row is not an object");
  }
  const source = value as Record<string, unknown>;
  if (!(CONTENT_TYPES as readonly string[]).includes(String(source.content_type))) {
    return err(`prompt_template row has an unknown content type: ${String(source.content_type)}`);
  }
  const version = source.version;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return err(`prompt_template row has no usable version: ${String(version)}`);
  }
  const body = source.body;
  if (typeof body !== "string" || blank(body)) {
    return err("prompt_template row has an empty body");
  }
  if (source.is_active !== true) {
    return err("prompt_template row is not active");
  }
  return ok({ contentType: source.content_type as ContentType, version, body: body.trim() });
}

export function resolveTemplate(
  rows: readonly unknown[],
  contentType: ContentType,
): PromptTemplate | null {
  let best: PromptTemplate | null = null;
  for (const row of rows) {
    const parsed = parsePromptTemplate(row);
    if (!parsed.ok || parsed.value.contentType !== contentType) {
      continue;
    }
    if (best === null || parsed.value.version > best.version) {
      best = parsed.value;
    }
  }
  return best;
}

export function templateProblems(template: PromptTemplate): string[] {
  const body = template.body.toLowerCase();
  return STRUCTURE_HINTS[template.contentType].filter((hint) => !body.includes(hint.toLowerCase()));
}

export function promptVersionLabel(template: PromptTemplate | null): string {
  return template === null ? `builtin:${BUILTIN_PROMPT_VERSION}` : `template:${template.version}`;
}

export function buildSystemPrompt(profile: BusinessProfile): Result<string> {
  if (
    blank(profile.businessName) ||
    blank(profile.industry) ||
    blank(profile.description) ||
    blank(profile.targetAudience)
  ) {
    return err("business profile is incomplete");
  }

  const prompt = [
    "You are a marketing content specialist for a small business.",
    "",
    `Business: ${profile.businessName.trim()}`,
    `Industry: ${profile.industry.trim()}`,
    `About: ${profile.description.trim()}`,
    `Target audience: ${profile.targetAudience.trim()}`,
    `Brand tone: ${BRAND_TONE_LABELS[profile.brandTone]} (${TONE_GUIDE[profile.brandTone]})`,
    "",
    "Rules:",
    "- Write in the brand tone above.",
    "- Do not invent facts, prices, discounts or special offers.",
    "- Return plain text only, with no Markdown formatting.",
  ].join("\n");

  invariant(prompt.length > 0, "system prompt is empty");
  return ok(prompt);
}

export function buildUserPrompt(
  input: PromptInput,
  template: PromptTemplate | null = null,
): Result<string> {
  if (!(CONTENT_TYPES as readonly string[]).includes(input.contentType)) {
    return err(`unknown content type: ${String(input.contentType)}`);
  }
  const topic = input.topic.trim();
  if (topic.length === 0) {
    return err("topic is required");
  }

  const keywords = input.keywords.map((item) => item.trim()).filter((item) => item.length > 0);
  const rules = template === null ? FORMAT_RULES[input.contentType] : template.body;
  const lines = [rules, "", `Topic: ${topic}`];
  if (keywords.length > 0) {
    lines.push(`Work these keywords in naturally: ${keywords.join(", ")}`);
  }

  const prompt = lines.join("\n");
  invariant(prompt.length > 0, "user prompt is empty");
  return ok(prompt);
}