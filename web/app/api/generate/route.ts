import { NextResponse } from "next/server";
import { InvariantError } from "@/lib/assert";
import { MissingEnvError } from "@/lib/env";
import { evaluateDraft } from "@/lib/evaluate";
import {
  GENERATION_TEMPERATURE,
  generatorFromEnv,
  type ContentGenerator,
} from "@/lib/generator";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { parseBusinessProfile, parseDraft } from "@/lib/rows";
import { parseIdempotencyKey } from "@/lib/idempotency";
import { supabaseServer } from "@/lib/supabase/server";
import {
  MONTHLY_LIMIT,
  parseGenerationRequest,
  type GenerationFailure,
} from "@/lib/types";

export const runtime = "nodejs";

const AI_FAILED = "The AI service could not generate content. Please try again.";
const AI_NO_RESPONSE = "The AI service did not respond. Please try again.";
const AI_NOT_SET_UP = "The AI service is not set up yet.";
const UNIQUE_VIOLATION = "23505";

const FAILURES: Record<GenerationFailure["kind"], { status: number; message: string }> = {
  timeout: { status: 504, message: AI_NO_RESPONSE },
  unreachable: { status: 504, message: AI_NO_RESPONSE },
  upstream: { status: 502, message: AI_FAILED },
  unusable: { status: 502, message: AI_FAILED },
};

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function startOfMonthUtc(now: Date): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Request body must be JSON.", 400);
  }
  const parsed = parseGenerationRequest(body);
  if (!parsed.ok) {
    return fail(parsed.error, 400);
  }
  const input = parsed.value;

  const idempotencyKey = parseIdempotencyKey(request.headers.get("idempotency-key"));
  if (!idempotencyKey.ok) {
    return fail(idempotencyKey.error, 400);
  }
  const key = idempotencyKey.value;

  let supabase: Awaited<ReturnType<typeof supabaseServer>>;
  try {
    supabase = await supabaseServer();
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error(`Supabase is not configured: ${error.variable} is not set`);
      return fail("The database is not set up yet.", 500);
    }
    throw error;
  }
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError !== null || auth.user === null) {
    return fail("You must be logged in to generate content.", 401);
  }
  const user = auth.user;

  if (key !== null) {
    const { data: replayRow } = await supabase
      .from("generated_content")
      .select("*")
      .eq("user_id", user.id)
      .eq("idempotency_key", key)
      .maybeSingle();
    if (replayRow !== null) {
      const replay = parseDraft(replayRow);
      if (replay.ok) {
        return NextResponse.json({ draft: replay.value }, { status: 200 });
      }
    }
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("business_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError !== null) {
    return fail("Could not load your business profile.", 500);
  }
  if (profileRow === null) {
    return fail("Create your business profile before generating content.", 409);
  }
  const profile = parseBusinessProfile(profileRow);
  if (!profile.ok) {
    return fail(profile.error, 500);
  }

  const { count, error: countError } = await supabase
    .from("generated_content")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonthUtc(new Date()));
  if (countError !== null) {
    return fail("Could not check your monthly limit.", 500);
  }
  if ((count ?? 0) >= MONTHLY_LIMIT) {
    return fail("You have reached your monthly generation limit.", 429);
  }

  const system = buildSystemPrompt(profile.value);
  if (!system.ok) {
    return fail(system.error, 400);
  }
  const userPrompt = buildUserPrompt({ ...input, profile: profile.value });
  if (!userPrompt.ok) {
    return fail(userPrompt.error, 400);
  }

  let generator: ContentGenerator;
  try {
    generator = generatorFromEnv();
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error(`The AI service is not configured: ${error.variable} is not set`);
      return fail(AI_NOT_SET_UP, 500);
    }
    if (error instanceof InvariantError) {
      console.error(`The AI service is misconfigured: ${error.detail}`);
      return fail(AI_NOT_SET_UP, 500);
    }
    throw error;
  }

  const generated = await generator.generate({
    systemPrompt: system.value,
    userPrompt: userPrompt.value,
    temperature: GENERATION_TEMPERATURE,
  });
  if (!generated.ok) {
    const failure = generated.error;
    const route = FAILURES[failure.kind];
    console.error(
      `Generation failed via ${generator.provider} ${generator.model}: ${failure.kind}`,
    );
    if (failure.kind === "upstream") {
      console.error(`Upstream answered with status ${failure.status}`);
    }
    return fail(route.message, route.status);
  }
  const output = generated.value;
  const text = output.text;

  const evaluation = evaluateDraft({
    contentText: text,
    contentType: input.contentType,
    keywords: input.keywords,
    brandTone: profile.value.brandTone,
    rating: null,
  });
  if (!evaluation.ok) {
    console.error(`Draft was not evaluated: ${evaluation.error}`);
  }

  const { data: saved, error: saveError } = await supabase
    .from("generated_content")
    .insert({
      user_id: user.id,
      content_type: input.contentType,
      topic: input.topic,
      keywords: input.keywords,
      content_text: text,
      model: generator.model,
      temperature: GENERATION_TEMPERATURE,
      system_prompt: system.value,
      user_prompt: userPrompt.value,
      analysis: evaluation.ok ? evaluation.value : null,
      usage: output.usage,
      idempotency_key: key,
    })
    .select("*")
    .single();
  if (saveError !== null) {
    if (key !== null && saveError.code === UNIQUE_VIOLATION) {
      const { data: existing } = await supabase
        .from("generated_content")
        .select("*")
        .eq("user_id", user.id)
        .eq("idempotency_key", key)
        .maybeSingle();
      const replay = existing === null ? null : parseDraft(existing);
      if (replay !== null && replay.ok) {
        return NextResponse.json({ draft: replay.value }, { status: 200 });
      }
    }
    console.error(`Could not save the draft: ${saveError.message}`);
    return fail("The draft could not be saved. Please try again.", 500);
  }
  const draft = parseDraft(saved);
  if (!draft.ok) {
    return fail(draft.error, 500);
  }
  return NextResponse.json({ draft: draft.value }, { status: 201 });
}