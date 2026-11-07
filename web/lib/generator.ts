import { invariant } from "./assert.ts";
import { optionalEnv, requireEnv } from "./env.ts";
import { GEMINI_BASE_URL, geminiGenerate } from "./gemini.ts";
import type { GeneratedText, GenerationFailure, Result } from "./types.ts";

export const GENERATION_TEMPERATURE = 0.7;
export const GENERATOR_DEFAULT_PROVIDER = "gemini";
export const GENERATOR_DEFAULT_MODEL = "gemini-3.5-flash-lite";

export type GeneratorRequest = {
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
};

export type GeneratorSettings = {
  provider: string;
  model: string;
  baseUrl: string;
  apiKey: string; // @waiver PII: a field name, not a value
};

export type ContentGenerator = {
  provider: string;
  model: string;
  baseUrl: string;
  generate: (request: GeneratorRequest) => Promise<Result<GeneratedText, GenerationFailure>>;
};

export function createGenerator(settings: GeneratorSettings): ContentGenerator {
  invariant(
    settings.provider === GENERATOR_DEFAULT_PROVIDER,
    `unknown generation provider: ${settings.provider}`,
  );
  invariant(settings.model.trim().length > 0, "generation model is empty");
  invariant(settings.baseUrl.trim().length > 0, "generation base url is empty");
  invariant(settings.apiKey.trim().length > 0, "generation api key is empty");
  return {
    provider: settings.provider,
    model: settings.model,
    baseUrl: settings.baseUrl,
    generate: (request) =>
      geminiGenerate(settings.apiKey, settings.model, settings.baseUrl, request),
  };
}

export function generatorFromEnv(): ContentGenerator {
  const provider = optionalEnv("GENERATOR_PROVIDER") ?? GENERATOR_DEFAULT_PROVIDER;
  invariant(
    provider === GENERATOR_DEFAULT_PROVIDER,
    `unknown generation provider: ${provider}`,
  );
  const model =
    optionalEnv("GENERATOR_MODEL") ?? optionalEnv("GEMINI_MODEL") ?? GENERATOR_DEFAULT_MODEL;
  const baseUrl = optionalEnv("GENERATOR_BASE_URL") ?? GEMINI_BASE_URL;
  const apiKey = requireEnv("GEMINI_API_KEY"); // @waiver PII: reads the variable name
  return createGenerator({ provider, model, baseUrl, apiKey });
}
