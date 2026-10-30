export const CONTENT_TYPES = [
  "blog_outline",
  "social_caption",
  "email_newsletter",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const BRAND_TONES = ["professional", "casual", "friendly"] as const;

export type BrandTone = (typeof BRAND_TONES)[number];

export const DRAFT_STATUSES = ["draft", "published", "discarded"] as const;

export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  blog_outline: "Blog outline",
  social_caption: "Social media caption",
  email_newsletter: "Email newsletter",
};

export const BRAND_TONE_LABELS: Record<BrandTone, string> = {
  professional: "Professional",
  casual: "Casual",
  friendly: "Friendly",
};

export const DRAFT_STATUS_LABELS: Record<DraftStatus, string> = {
  draft: "Draft",
  published: "Published",
  discarded: "Discarded",
};

export const QUALITY_WEIGHTS = {
  readabilityScore: 0.1,
  toneScore: 0.2,
  keywordScore: 0.2,
  structureScore: 0.15,
  userSatisfactionScore: 0.35,
} as const;

export type QualityMetric = keyof typeof QUALITY_WEIGHTS;

export const QUALITY_METRICS = Object.keys(QUALITY_WEIGHTS) as QualityMetric[];

export const QUALITY_THRESHOLD = 0.6;

export type QualityReport = Record<QualityMetric, number> & { overallScore: number };

export type BusinessProfile = {
  id: string;
  userId: string;
  businessName: string;
  industry: string;
  description: string;
  targetAudience: string;
  brandTone: BrandTone;
};

export type BusinessProfileDraft = Omit<BusinessProfile, "id" | "userId">;

export type GenerationParameters = {
  model: string;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
};

export type Draft = {
  id: string;
  userId: string;
  contentType: ContentType;
  topic: string;
  keywords: string[];
  contentText: string;
  rating: number | null;
  status: DraftStatus;
  statusChangedAt: string | null;
  analysis: QualityReport | null;
  parameters: GenerationParameters | null;
  createdAt: string;
};

export type GenerationRequest = {
  contentType: ContentType;
  topic: string;
  keywords: string[];
};

export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E = string> = Ok<T> | Err<E>;

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export const FAVOURITE_MIN_RATING = 4;
export const MONTHLY_LIMIT = 20;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isContentType(value: unknown): value is ContentType {
  return typeof value === "string" && (CONTENT_TYPES as readonly string[]).includes(value);
}

export function isBrandTone(value: unknown): value is BrandTone {
  return typeof value === "string" && (BRAND_TONES as readonly string[]).includes(value);
}

export function isDraftStatus(value: unknown): value is DraftStatus {
  return typeof value === "string" && (DRAFT_STATUSES as readonly string[]).includes(value);
}

export function isRating(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= RATING_MIN &&
    value <= RATING_MAX
  );
}

export function parseContentType(value: unknown): Result<ContentType> {
  if (!isContentType(value)) {
    return err(`unknown content type: ${String(value)}`);
  }
  return ok(value);
}

export function parseBrandTone(value: unknown): Result<BrandTone> {
  if (!isBrandTone(value)) {
    return err(`unknown brand tone: ${String(value)}`);
  }
  return ok(value);
}

export function parseRating(value: unknown): Result<number> {
  if (!isRating(value)) {
    return err(`rating must be an integer from ${RATING_MIN} to ${RATING_MAX}`);
  }
  return ok(value);
}

export function parseGenerationRequest(value: unknown): Result<GenerationRequest> {
  if (value === null || typeof value !== "object") {
    return err("request body must be an object");
  }
  const body = value as Record<string, unknown>;
  const contentType = parseContentType(body.contentType);
  if (!contentType.ok) {
    return contentType;
  }
  if (typeof body.topic !== "string" || body.topic.trim().length === 0) {
    return err("topic is required");
  }
  const raw = body.keywords;
  if (raw !== undefined && !Array.isArray(raw)) {
    return err("keywords must be an array");
  }
  const keywords = (raw ?? []) as unknown[];
  if (keywords.some((item) => typeof item !== "string")) {
    return err("every keyword must be a string");
  }
  return ok({
    contentType: contentType.value,
    topic: body.topic.trim(),
    keywords: (keywords as string[]).map((item) => item.trim()).filter((item) => item.length > 0),
  });
}