import { invariant } from "./assert.ts";
import { err, ok, type Result } from "./types.ts";

export const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash-lite";
export const GEMINI_TEMPERATURE = 0.7;
export const GEMINI_MAX_OUTPUT_TOKENS = 1024;

export type GeminiBody = {
  systemInstruction: { parts: { text: string }[] };
  contents: { role: "user"; parts: { text: string }[] }[];
  generationConfig: { temperature: number; maxOutputTokens: number };
};

export function geminiUrl(model: string): string {
  invariant(model.trim().length > 0, "gemini model name is empty");
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
}

export function geminiBody(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
): GeminiBody {
  invariant(systemPrompt.length > 0, "system prompt is empty");
  invariant(userPrompt.length > 0, "user prompt is empty");
  return {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { temperature, maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS },
  };
}

function record(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function extractGeminiText(value: unknown): Result<string> {
  const root = record(value);
  if (root === null) {
    return err("gemini response is not an object");
  }
  const candidates = root.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return err("gemini response has no candidates");
  }
  const content = record(record(candidates[0])?.content);
  const parts = content?.parts;
  if (!Array.isArray(parts)) {
    return err("gemini response has no content parts");
  }

  const pieces: string[] = [];
  for (const part of parts) {
    const item = record(part);
    if (item === null || item.thought === true) {
      continue;
    }
    if (typeof item.text === "string") {
      pieces.push(item.text);
    }
  }

  const joined = pieces.join("").trim();
  return joined.length > 0 ? ok(joined) : err("gemini returned no text");
}