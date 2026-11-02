import { invariant } from "./assert.ts";
import { assertQualityReport, weightedScore } from "./score.ts";
import {
  RATING_MAX,
  type BrandTone,
  type ContentType,
  type QualityMetric,
  type QualityReport,
  type Result,
  err,
  ok,
} from "./types.ts";

export type EvaluationInput = {
  contentText: string;
  contentType: ContentType;
  keywords: readonly string[];
  brandTone: BrandTone;
  rating: number | null;
};

const WORD = /[A-Za-z][A-Za-z'-]*/g;
const VOWEL_GROUP = /[aeiouy]+/g;
const HEADING = /^\s*(#{1,6}\s+\S|\d+[.)]\s+\S)/;
const LABEL_LINE = /^[A-Za-z][^.!?]{2,60}:\s*$/;
const CTA = new RegExp(
  [
    "try",
    "shop",
    "book",
    "join",
    "learn",
    "sign up",
    "get",
    "discover",
    "visit",
    "click",
    "order",
    "download",
    "follow",
    "subscribe",
    "start",
  ]
    .map((verb) => `\\b${verb}\\b`)
    .join("|"),
  "i",
);
const WARMTH_TARGET: Record<BrandTone, number> = {
  professional: 0.15,
  casual: 0.5,
  friendly: 0.75,
};

const UNRATED_SATISFACTION = 0.5;

function clamp(value: number, low: number, high: number): number {
  invariant(Number.isFinite(value), "clamped value is not finite");
  invariant(low < high, `clamp bounds are reversed: ${low} ${high}`);
  return Math.min(high, Math.max(low, value));
}

function words(text: string): string[] {
  return text.match(WORD) ?? [];
}

function sentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function syllablesIn(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  invariant(clean.length > 0, "syllable count got an empty word");
  if (clean.length <= 3) {
    return 1;
  }
  const groups = clean.replace(/e$/, "").match(VOWEL_GROUP) ?? [];
  return Math.max(1, groups.length);
}

function fleschReadingEase(text: string): number {
  const wordList = words(text);
  const sentenceList = sentences(text);
  if (wordList.length === 0 || sentenceList.length === 0) {
    return 0;
  }
  const syllables = wordList.reduce((total, word) => total + syllablesIn(word), 0);
  const ease =
    206.835 -
    1.015 * (wordList.length / sentenceList.length) -
    84.6 * (syllables / wordList.length);
  return clamp(ease, 0, 100);
}

export function readabilityScore(text: string): number {
  return clamp(fleschReadingEase(text) / 100, 0, 1);
}

export function keywordCoverage(text: string, keywords: readonly string[]): number {
  const wanted = keywords.map((keyword) => keyword.trim().toLowerCase()).filter(Boolean);
  if (wanted.length === 0) {
    return 1;
  }
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").replace(/\s+/g, " ")} `;
  const hits = wanted.filter((keyword) => haystack.includes(` ${keyword} `)).length;
  return hits / wanted.length;
}

function sectionHeadings(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => HEADING.test(line) || LABEL_LINE.test(line));
}

type Check = (text: string) => boolean;

const BLOG_CHECKS: Check[] = [
  (text) => /\bintroduction\b/i.test(text),
  (text) => {
    const sections = sectionHeadings(text).length;
    return sections >= 3 && sections <= 6;
  },
  (text) => /\b(conclusion|summary|takeaway|wrap[- ]?up)\b/i.test(text),
];

const SOCIAL_CHECKS: Check[] = [
  (text) => text.trim().length > 0 && text.trim().length <= 280,
  (text) => CTA.test(text),
];

const EMAIL_CHECKS: Check[] = [
  (text) => /\bsubject\b/i.test(text),
  (text) => /\bpreview\b/i.test(text),
  (text) => /\b(button|cta|call to action)\b/i.test(text) || CTA.test(text),
];

const CHECKS: Record<ContentType, Check[]> = {
  blog_outline: BLOG_CHECKS,
  social_caption: SOCIAL_CHECKS,
  email_newsletter: EMAIL_CHECKS,
};

export function structureScore(text: string, contentType: ContentType): number {
  const checks = CHECKS[contentType];
  invariant(checks.length > 0, `no structure checks for ${contentType}`);
  const passed = checks.filter((check) => check(text)).length;
  return passed / checks.length;
}

function warmth(text: string): number {
  const perSentence = (pattern: RegExp) =>
    (text.match(pattern) ?? []).length / Math.max(1, sentences(text).length);
  const contractions = perSentence(/\b\w+'(s|t|re|ll|ve|d|m)\b/gi);
  const exclamations = perSentence(/!/g);
  const direct = perSentence(/\b(you|your)\b/gi);
  const inclusive = perSentence(/\b(we|our|us)\b/gi);
  const informal = perSentence(/\b(hey|awesome|super|cool|gonna|folks|guys|stoked|love)\b/gi);
  return clamp(
    contractions * 0.3 + exclamations * 0.25 + direct * 0.2 + inclusive * 0.1 + informal * 0.35,
    0,
    1,
  );
}

export function toneAlignment(text: string, brandTone: BrandTone): number {
  const target = WARMTH_TARGET[brandTone];
  invariant(target >= 0 && target <= 1, `tone target out of range: ${target}`);
  return clamp(1 - Math.abs(warmth(text) - target), 0, 1);
}

export function satisfactionFrom(rating: number | null): number {
  if (rating === null) {
    // ponytail: an unrated draft scores neutral until real ratings exist (G3)
    return UNRATED_SATISFACTION;
  }
  invariant(Number.isInteger(rating), `rating is not an integer: ${rating}`);
  invariant(rating >= 1 && rating <= RATING_MAX, `rating out of range: ${rating}`);
  return clamp(rating / RATING_MAX, 0, 1);
}

export function evaluateDraft(input: EvaluationInput): Result<QualityReport> {
  const text = input.contentText.trim();
  if (text.length === 0) {
    return err("cannot evaluate an empty draft");
  }
  if (words(text).length < 3) {
    return err("draft is too short to evaluate");
  }

  const metrics = {
    readabilityScore: readabilityScore(text),
    toneScore: toneAlignment(text, input.brandTone),
    keywordScore: keywordCoverage(text, input.keywords),
    structureScore: structureScore(text, input.contentType),
    userSatisfactionScore: satisfactionFrom(input.rating),
  } satisfies Record<QualityMetric, number>;

  const report: QualityReport = { ...metrics, overallScore: weightedScore(metrics) };
  assertQualityReport(report);
  return ok(report);
}
