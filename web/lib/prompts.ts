import { invariant } from "./assert.ts";
import {
  BRAND_TONE_LABELS,
  CONTENT_TYPES,
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

const TONE_GUIDE: Record<BrandTone, string> = {
  professional: "clear, polished and confident, with no slang",
  casual: "relaxed and conversational, like talking to a neighbour",
  friendly: "warm, welcoming and upbeat",
};

const FORMAT_RULES: Record<ContentType, string> = {
  social_caption: [
    "Write one social media caption.",
    "Keep it under 280 characters.",
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

function blank(value: string): boolean {
  return value.trim().length === 0;
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

export function buildUserPrompt(input: PromptInput): Result<string> {
  if (!(CONTENT_TYPES as readonly string[]).includes(input.contentType)) {
    return err(`unknown content type: ${String(input.contentType)}`);
  }
  const topic = input.topic.trim();
  if (topic.length === 0) {
    return err("topic is required");
  }

  const keywords = input.keywords.map((item) => item.trim()).filter((item) => item.length > 0);
  const lines = [FORMAT_RULES[input.contentType], "", `Topic: ${topic}`];
  if (keywords.length > 0) {
    lines.push(`Work these keywords in naturally: ${keywords.join(", ")}`);
  }

  const prompt = lines.join("\n");
  invariant(prompt.length > 0, "user prompt is empty");
  return ok(prompt);
}