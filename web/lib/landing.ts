import { invariant } from "./assert.ts";

export const CONTENT_TYPES = [
  "Social Media Post",
  "Email Newsletter",
  "Blog Outline",
  "Image Prompt",
] as const;

export type LandingContentType = (typeof CONTENT_TYPES)[number];

export type LandingBrief = {
  businessName: string;
  businessType: string;
  audience: string;
  message: string;
};

const SAMPLE_COPY: Record<LandingContentType, string> = {
  "Social Media Post": `Freshly roasted, ethically sourced, and ready before your first meeting.

This week only: any large coffee comes with a pastry.

#SupportLocal #CoffeeLovers #SunriseCafe`,
  "Email Newsletter": `Subject: A quieter Tuesday, solved

Hi there,

We saved you a seat. From 2pm every Tuesday, a coffee and a pastry is eight dollars.

See you soon,
Sunrise Cafe`,
  "Blog Outline": `1. Why Tuesday afternoons go quiet in a cafe
2. Three offers that fill a slow afternoon
3. How to announce them without tiring your regulars
4. What to measure after the first month`,
  "Image Prompt": `A warm product photograph of a flat white on a wooden cafe table,
morning window light, shallow depth of field, no text, no logos.`,
};

export function sampleCopy(type: LandingContentType): string {
  invariant(CONTENT_TYPES.includes(type), `unknown content type: ${type}`);
  return SAMPLE_COPY[type];
}

export function generateCopy(type: LandingContentType, brief: LandingBrief): string {
  invariant(CONTENT_TYPES.includes(type), `unknown content type: ${type}`);

  const name = filled(brief.businessName, "Your business");
  const audience = filled(brief.audience, "your customers");
  const industry = filled(brief.businessType, "your industry");
  const message = filled(brief.message, "We have something new for you this week.");

  if (type === "Social Media Post") {
    const tag = tagFor(name);
    return [
      `${name} has news for ${audience}.`,
      "",
      message,
      "",
      `${tag} #SmallBusiness`,
    ].join("\n");
  }

  if (type === "Email Newsletter") {
    return [
      `Subject: News from ${name}`,
      "",
      "Hi there,",
      "",
      message,
      "",
      "See you soon,",
      name,
      "",
      `Sent to ${audience}.`,
    ].join("\n");
  }

  if (type === "Blog Outline") {
    return [
      `1. Why ${audience} pick a ${industry}`,
      `2. What ${name} changed this month`,
      `3. ${message}`,
      "4. What to measure next",
    ].join("\n");
  }

  return [
    message,
    "",
    `Style: photograph for ${name}, made for ${audience}.`,
    `Setting: ${industry}, natural light, no text or logos.`,
  ].join("\n");
}

function filled(value: string, fallback: string): string {
  const trimmed = value.trim();
  invariant(typeof trimmed === "string", "trim returned something other than a string");
  return trimmed.length === 0 ? fallback : trimmed;
}

function tagFor(name: string): string {
  const word = name.replace(/[^A-Za-z0-9]/g, "");
  invariant(word.length <= name.length, "a tag cannot be longer than the name it came from");
  return `#${word.length === 0 ? "YourBusiness" : word}`;
}
