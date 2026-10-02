import type { BusinessProfile, ContentType, Result } from "@/lib/types";

export type PromptInput = {
  contentType: ContentType;
  topic: string;
  keywords: string[];
  profile: BusinessProfile;
};

const NOT_BUILT: Result<never> = { ok: false, error: "W2.2 not built" };

export function buildSystemPrompt(_profile: BusinessProfile): Result<string> {
  return NOT_BUILT;
}

export function buildUserPrompt(_input: PromptInput): Result<string> {
  return NOT_BUILT;
}
