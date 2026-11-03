import { invariant } from "./assert.ts";
import { err, ok, type GenerationFailure, type Result } from "./types.ts";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
export const GEMINI_MAX_OUTPUT_TOKENS = 1024;
export const GEMINI_TIMEOUT_MS = 30_000;

export type GeminiBody = {
  systemInstruction: { parts: { text: string }[] };
  contents: { role: "user"; parts: { text: string }[] }[];
  generationConfig: { temperature: number; maxOutputTokens: number };
};

export type GeminiRequest = {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
};

export function geminiUrl(model: string, baseUrl: string = GEMINI_BASE_URL): string {
  invariant(model.trim().length > 0, "gemini model name is empty");
  invariant(baseUrl.trim().length > 0, "gemini base url is empty");
  const root = baseUrl.replace(/\/+$/, "");
  return `${root}/models/${encodeURIComponent(model)}:generateContent`;
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

export async function geminiGenerate(
  apiKey: string, // @waiver PII: a parameter, not a value
  model: string,
  baseUrl: string,
  request: GeminiRequest,
): Promise<Result<string, GenerationFailure>> {
  invariant(apiKey.trim().length > 0, "gemini api key is empty");
  let response: Response;
  try {
    response = await fetch(geminiUrl(model, baseUrl), {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify(
        geminiBody(request.systemPrompt, request.userPrompt, request.temperature),
      ),
      signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "unknown";
    return name === "TimeoutError"
      ? err({ kind: "timeout" })
      : err({ kind: "unreachable", detail: name });
  }
  if (!response.ok) {
    return err({ kind: "upstream", status: response.status });
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return err({ kind: "unusable", detail: "response body was not JSON" });
  }
  const extracted = extractGeminiText(payload);
  if (!extracted.ok) {
    return err({ kind: "unusable", detail: extracted.error });
  }
  return ok(extracted.value);
}