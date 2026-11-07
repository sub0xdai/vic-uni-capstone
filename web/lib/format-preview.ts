import { sectionHeadings } from "./evaluate.ts";
import { SOCIAL_CAPTION_MAX, type ContentType } from "./types.ts";

export type PreviewView =
  | { kind: "plain"; text: string }
  | {
      kind: "caption";
      text: string;
      length: number;
      limit: number;
      overBudget: boolean;
    }
  | {
      kind: "email";
      subject: string | null;
      preview: string | null;
      body: string;
      button: string | null;
    }
  | {
      kind: "outline";
      introduction: string | null;
      headings: string[];
      conclusion: string | null;
    };

const SUBJECT = /^\s*subject\s*:\s*(.*)$/i;
const PREVIEW = /^\s*preview\s*:\s*(.*)$/i;
const BUTTON = /^\s*button\s*:\s*(.*)$/i;
const INTRODUCTION = /^\s*introduction\b\s*:?\s*(.*)$/i;
const CONCLUSION = /^\s*(?:conclusion|summary|takeaway|wrap[- ]?up)\b\s*:?\s*(.*)$/i;

function labelledValue(lines: readonly string[], pattern: RegExp): string | null {
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(pattern);
    if (match === null) {
      continue;
    }
    const inline = match[1].trim();
    if (inline.length > 0) {
      return inline;
    }
    const next = lines
      .slice(index + 1)
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    return next ?? null;
  }
  return null;
}

function captionOf(text: string): PreviewView {
  const length = text.trim().length;
  return {
    kind: "caption",
    text: text.trim(),
    length,
    limit: SOCIAL_CAPTION_MAX,
    overBudget: length > SOCIAL_CAPTION_MAX,
  };
}

function emailOf(text: string): PreviewView {
  const lines = text.split("\n");
  const subject = labelledValue(lines, SUBJECT);
  const preview = labelledValue(lines, PREVIEW);
  const button = labelledValue(lines, BUTTON);
  if (subject === null && preview === null && button === null) {
    return { kind: "plain", text };
  }
  const body = lines
    .filter((line) => !SUBJECT.test(line) && !PREVIEW.test(line) && !BUTTON.test(line))
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
  return { kind: "email", subject, preview, body, button };
}

function outlineOf(text: string): PreviewView {
  const lines = text.split("\n");
  const introduction = labelledValue(lines, INTRODUCTION);
  const conclusion = labelledValue(lines, CONCLUSION);
  const headings = sectionHeadings(text).filter(
    (line) => !INTRODUCTION.test(line) && !CONCLUSION.test(line),
  );
  if (introduction === null && conclusion === null && headings.length === 0) {
    return { kind: "plain", text };
  }
  return { kind: "outline", introduction, headings, conclusion };
}

export function previewOf(contentType: ContentType, text: string): PreviewView {
  if (text.trim().length === 0) {
    return { kind: "plain", text };
  }
  if (contentType === "social_caption") {
    return captionOf(text);
  }
  if (contentType === "email_newsletter") {
    return emailOf(text);
  }
  return outlineOf(text);
}
