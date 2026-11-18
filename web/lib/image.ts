
import { invariant } from "./assert.ts";
import { err, ok, type Result } from "./types.ts";

export const IMAGE_PROMPT_MAX = 2048;
export const IMAGE_MIME = "image/jpeg";

export function parseImagePrompt(value: unknown): Result<string> {
  if (typeof value !== "string" || value.trim().length === 0) {
    return err("Please enter an image description.");
  }
  const prompt = value.trim();
  if (prompt.length > IMAGE_PROMPT_MAX) {
    return err(`Image description must be ${IMAGE_PROMPT_MAX} characters or fewer.`);
  }
  return ok(prompt);
}

export function imageDataUrl(base64: string): string {
  invariant(typeof base64 === "string" && base64.length > 0, "no image data to wrap");
  return `data:${IMAGE_MIME};base64,${base64}`;
}
