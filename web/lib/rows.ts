import {
  CONTENT_TYPES,
  QUALITY_METRICS,
  err,
  isBrandTone,
  isRating,
  ok,
  type BusinessProfile,
  type ContentType,
  type Draft,
  type GenerationParameters,
  type QualityMetric,
  type QualityReport,
  type Result,
} from "./types.ts";

type Row = Record<string, unknown>;

function row(value: unknown): Row | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Row;
}

function text(source: Row, key: string): string | null {
  const value = source[key];
  return typeof value === "string" ? value : null;
}

function number(source: Row, key: string): number | null {
  const value = source[key];
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseContentType(value: unknown): ContentType | null {
  if (typeof value !== "string") {
    return null;
  }
  return (CONTENT_TYPES as readonly string[]).includes(value)
    ? (value as ContentType)
    : null;
}

export function parseQualityReport(value: unknown): QualityReport | null {
  const source = row(value);
  if (source === null) {
    return null;
  }
  const metrics = {} as Record<QualityMetric, number>;
  for (const key of QUALITY_METRICS) {
    const metric = number(source, key);
    if (metric === null || metric < 0 || metric > 1) {
      return null;
    }
    metrics[key] = metric;
  }
  const overallScore = number(source, "overallScore");
  if (overallScore === null || overallScore < 0 || overallScore > 1) {
    return null;
  }
  return { ...metrics, overallScore };
}

function parseParameters(source: Row): GenerationParameters | null {
  const model = text(source, "model");
  const temperature = number(source, "temperature");
  const systemPrompt = text(source, "system_prompt");
  const userPrompt = text(source, "user_prompt");
  if (
    model === null ||
    temperature === null ||
    systemPrompt === null ||
    userPrompt === null
  ) {
    return null;
  }
  return { model, temperature, systemPrompt, userPrompt };
}

export function parseBusinessProfile(value: unknown): Result<BusinessProfile> {
  const source = row(value);
  if (source === null) {
    return err("business_profile row is not an object");
  }
  const id = text(source, "id");
  const userId = text(source, "user_id");
  const businessName = text(source, "business_name");
  const industry = text(source, "industry");
  const description = text(source, "description");
  const targetAudience = text(source, "target_audience");
  const brandTone: unknown = source.brand_tone;

  if (
    id === null ||
    userId === null ||
    businessName === null ||
    industry === null ||
    description === null ||
    targetAudience === null
  ) {
    return err("business_profile row is missing a required text column");
  }
  if (!isBrandTone(brandTone)) {
    return err(`business_profile.brand_tone is not a known tone: ${String(brandTone)}`);
  }
  return ok({
    id,
    userId,
    businessName,
    industry,
    description,
    targetAudience,
    brandTone,
  });
}

export function parseDraft(value: unknown): Result<Draft> {
  const source = row(value);
  if (source === null) {
    return err("generated_content row is not an object");
  }
  const id = text(source, "id");
  const userId = text(source, "user_id");
  const contentType = parseContentType(source.content_type);
  const topic = text(source, "topic");
  const contentText = text(source, "content_text");
  const createdAt = text(source, "created_at");

  if (
    id === null ||
    userId === null ||
    contentType === null ||
    topic === null ||
    contentText === null ||
    createdAt === null
  ) {
    return err("generated_content row is missing a required column");
  }

  const rawKeywords = source.keywords;
  const keywords = Array.isArray(rawKeywords)
    ? rawKeywords.filter((item): item is string => typeof item === "string")
    : [];
  const rating: unknown = source.rating;

  return ok({
    id,
    userId,
    contentType,
    topic,
    keywords,
    contentText,
    rating: isRating(rating) ? rating : null,
    analysis: parseQualityReport(source.analysis),
    parameters: parseParameters(source),
    createdAt,
  });
}
