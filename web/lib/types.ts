export const CONTENT_TYPES = [
  "blog_outline",
  "social_caption",
  "email_newsletter",
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number];

export const BRAND_TONES = ["professional", "casual", "friendly"] as const;

export type BrandTone = (typeof BRAND_TONES)[number];

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

export type BusinessProfile = {
  id: string;
  userId: string;
  businessName: string;
  industry: string;
  description: string;
  targetAudience: string;
  brandTone: BrandTone;
};

export type BusinessProfileDraft = Omit<
  BusinessProfile,
  "id" | "userId"
>;

export type QualityReport = {
  overallScore: number;
  readabilityScore: number;
  toneScore: number;
  keywordScore: number;
  structureScore: number;
  userSatisfactionScore: number;
};

export type Draft = {
  id: string;
  userId: string;
  contentType: ContentType;
  topic: string;
  keywords: string[];
  contentText: string;
  rating: number | null;
  analysis: QualityReport | null;
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

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

export function isBrandTone(value: string): value is BrandTone {
  return (BRAND_TONES as readonly string[]).includes(value);
}
